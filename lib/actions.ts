'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, habits, dailyData, dailyLogs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Habit, DayData } from "@/lib/types"

/**
 * 1. 유저의 전체 습관 목록 동기화 (Upsert)
 */
export async function syncHabits(newHabits: Habit[], routineStartDate?: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const userId = session.user.id;

  // 1. 유저 테이블의 startDate 업데이트
  if (routineStartDate) {
    await db.update(users).set({ startDate: routineStartDate }).where(eq(users.id, userId));
  }

  // 2. 습관 목록 업데이트 (기존 삭제 후 다시 삽입)
  await db.delete(habits).where(eq(habits.userId, userId));
  
  if (newHabits.length > 0) {
    await db.insert(habits).values(
        newHabits.map(h => ({
            id: h.id,
            userId,
            name: h.name,
            color: h.color,
            inputType: h.inputType,
            order: h.order,
        }))
    );
  }
  return { success: true };
}

/**
 * 2. 일일 기록 동기화 (Upsert)
 */
export async function syncDailyData(dateStr: string, data: DayData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const userId = session.user.id;

    // 2-1. 기존 기록 확인
    const existing = await db.query.dailyData.findFirst({
        where: and(eq(dailyData.userId, userId), eq(dailyData.dateStr, dateStr))
    });

    let dailyDataId: number;

    if (existing) {
        dailyDataId = existing.id;
        await db.update(dailyData)
            .set({
                dayNum: data.day,
                memo: data.memo,
                mood: data.mood,
                habitSnapshot: data.habitSnapshot,
                updatedAt: new Date(),
            })
            .where(eq(dailyData.id, dailyDataId));
    } else {
        const result = await db.insert(dailyData).values({
            userId,
            dateStr,
            dayNum: data.day,
            memo: data.memo,
            mood: data.mood,
            habitSnapshot: data.habitSnapshot,
        }).returning({ id: dailyData.id });
        dailyDataId = result[0].id;
    }

    // 2-2. 로그 업데이트 (기존 로그 삭제 후 삽입)
    await db.delete(dailyLogs).where(eq(dailyLogs.dailyDataId, dailyDataId));
    
    if (data.logs.length > 0) {
        await db.insert(dailyLogs).values(
            data.logs.map(l => ({
                dailyDataId,
                habitId: l.habitId,
                value: l.value,
            }))
        );
    }

    return { success: true };
}

/**
 * 3. 전체 데이터 불러오기 (로그인 시)
 */
export async function fetchUserData() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id;

    // 유저 기본 정보 (startDate 등)
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    // 습관 목록
    const dbHabits = await db.query.habits.findMany({
        where: eq(habits.userId, userId),
        orderBy: habits.order,
    });

    // 상세 기록 (로그 포함)
    const dbDailyData = await db.query.dailyData.findMany({
        where: eq(dailyData.userId, userId),
        with: {
            logs: true
        }
    });

    return {
        startDate: user?.startDate || null,
        habits: dbHabits as Habit[],
        dailyData: dbDailyData.reduce((acc, curr) => {
            acc[curr.dateStr] = {
                day: curr.dayNum,
                memo: curr.memo || '',
                mood: curr.mood || '',
                habitSnapshot: (curr.habitSnapshot as Habit[]) || undefined,
                logs: curr.logs.map(l => ({
                    habitId: l.habitId,
                    value: l.value
                }))
            };
            return acc;
        }, {} as Record<string, DayData>)
    }
}

/**
 * 4. 전체 백업 데이터 서버로 강제 푸시 (복구 시 사용)
 */
export async function syncFullBackup(data: { habits: Habit[], dailyData: Record<string, DayData>, startDate: string | null }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const userId = session.user.id;

    // 4-1. 습관 및 시작일 업데이트
    await syncHabits(data.habits, data.startDate);

    // 4-2. 모든 일일 기록 데이터 업데이트 (병렬 처리하되 순차적으로)
    const dates = Object.keys(data.dailyData);
    for (const dateStr of dates) {
        await syncDailyData(dateStr, data.dailyData[dateStr]);
    }

    return { success: true };
}
