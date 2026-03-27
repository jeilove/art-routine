'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, habits, dailyData, dailyLogs } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
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
 * 4. 전체 백업 데이터 서버로 강제 푸시 (복구 시 사용 - 병렬 처리로 속도 개선)
 */
export async function syncFullBackup(data: { habits: Habit[], dailyData: Record<string, DayData>, startDate: string | null }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    // 4-1. 습관 및 시작일 업데이트 (기존 습관 삭제 후 재삽입)
    await syncHabits(data.habits, data.startDate);

    // 4-2. 모든 일일 기록 데이터 업데이트 (병렬 처리로 속도 대폭 향상)
    const dates = Object.keys(data.dailyData);
    if (dates.length > 0) {
        // 모든 날짜의 동기화 작업을 한 번에 실행 (병렬)
        await Promise.all(
            dates.map(dateStr => syncDailyData(dateStr, data.dailyData[dateStr]))
        );
    }

    return { success: true };
}

/**
 * 5. 유저의 모든 데이터 초기화 (백엔드)
 */
export async function resetUserData() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = session.user.id;

        // 5-1. 일괄 삭제 (트랜잭션처럼 순서대로)
        // dailyLogs -> dailyData 순으로 삭제 (외래키 제약 고려)
        const userDailyData = await db.query.dailyData.findMany({
            where: eq(dailyData.userId, userId),
            columns: { id: true }
        });
        
        const ids = userDailyData.map(d => d.id);
        if (ids.length > 0) {
            await db.delete(dailyLogs).where(inArray(dailyLogs.dailyDataId, ids));
        }

        await db.delete(dailyData).where(eq(dailyData.userId, userId));
        await db.delete(habits).where(eq(habits.userId, userId));
        await db.update(users).set({ startDate: null }).where(eq(users.id, userId));

        revalidatePath('/'); // 캐시 무효화
        console.log(`[Server Action] Reset successful for user: ${userId}`);
        return { success: true };
    } catch (error) {
        console.error("[Server Action] Reset failed:", error);
        return { success: false, error: String(error) };
    }
}
