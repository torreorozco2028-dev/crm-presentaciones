import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is missing');
}

const pool = postgres(process.env.POSTGRES_URL, {
  max: process.env.NODE_ENV === 'production' ? 10 : 5,
});

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'production' ? false : true,
});
