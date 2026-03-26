import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Vercel Postgres DB 연결
export const db = drizzle(sql, { schema });
