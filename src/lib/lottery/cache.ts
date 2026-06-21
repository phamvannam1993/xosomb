import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { LotteryResult } from './types';
import { isCompleteLotteryResult } from './normalize';
import { isFutureDate } from './format';

const memoryCache = new Map<string, LotteryResult>();
const memoryRecentCache = new Map<string, LotteryResult[]>();

function isFileCacheEnabled() {
  return process.env.LOTTERY_FILE_CACHE !== 'false' && process.env.XSMB_FILE_CACHE !== 'false';
}

function cacheDirectory(code: string) {
  return path.join(process.cwd(), '.cache', 'lottery', code);
}

function cachePath(code: string, date: string) {
  return path.join(cacheDirectory(code), `${date}.json`);
}

function memoryKey(code: string, date: string) {
  return `${code}:${date}`;
}

function isSafeCachedResult(result: LotteryResult | null): result is LotteryResult {
  return Boolean(result && isCompleteLotteryResult(result) && !isFutureDate(result.date));
}

function clearRecentCache(code: string) {
  for (const key of memoryRecentCache.keys()) {
    if (key.startsWith(`${code}:`)) memoryRecentCache.delete(key);
  }
}

async function ensureCacheDirectory(code: string) {
  if (!isFileCacheEnabled()) return;
  await mkdir(cacheDirectory(code), { recursive: true });
}

async function writeJsonAtomically(filePath: string, data: unknown) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  try {
    await rename(tempPath, filePath);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

export async function readCachedResult(code: string, date: string): Promise<LotteryResult | null> {
  const key = memoryKey(code, date);
  const memory = memoryCache.get(key) || null;
  if (isSafeCachedResult(memory)) return { ...memory, dataSource: memory.dataSource || 'cache' };
  if (memory) memoryCache.delete(key);

  if (!isFileCacheEnabled()) return null;

  try {
    const raw = await readFile(cachePath(code, date), 'utf8');
    const parsed = JSON.parse(raw) as LotteryResult;
    if (!isSafeCachedResult(parsed) || parsed.code !== code) return null;
    memoryCache.set(key, parsed);
    return { ...parsed, dataSource: parsed.dataSource || 'cache' };
  } catch {
    return null;
  }
}

export async function writeCachedResult(result: LotteryResult): Promise<void> {
  if (!isSafeCachedResult(result)) return;
  memoryCache.set(memoryKey(result.code, result.date), result);
  clearRecentCache(result.code);

  if (!isFileCacheEnabled()) return;

  try {
    await ensureCacheDirectory(result.code);
    await writeJsonAtomically(cachePath(result.code, result.date), result);
  } catch {
    // Cache lỗi không được làm hỏng trang.
  }
}

export async function writeCachedResults(results: LotteryResult[]): Promise<void> {
  await Promise.all(results.map((result) => writeCachedResult(result)));
}

export async function readRecentCachedResults(code: string, limit = 30): Promise<LotteryResult[]> {
  const cacheKey = `${code}:${limit}`;
  const memory = memoryRecentCache.get(cacheKey);
  if (memory) return memory;

  const fromMemory = Array.from(memoryCache.values())
    .filter((item) => item.code === code)
    .filter((item) => isSafeCachedResult(item))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  if (!isFileCacheEnabled()) {
    memoryRecentCache.set(cacheKey, fromMemory);
    return fromMemory;
  }

  try {
    await ensureCacheDirectory(code);
    const filenames = await readdir(cacheDirectory(code));
    const fileResults = await Promise.all(
      filenames
        .filter((filename) => /^\d{4}-\d{2}-\d{2}\.json$/.test(filename))
        .map(async (filename) => {
          try {
            const raw = await readFile(path.join(cacheDirectory(code), filename), 'utf8');
            const parsed = JSON.parse(raw) as LotteryResult;
            return parsed.code === code && isSafeCachedResult(parsed) ? parsed : null;
          } catch {
            return null;
          }
        })
    );

    const merged = [...fromMemory, ...(fileResults.filter(Boolean) as LotteryResult[])];
    const unique = Array.from(new Map(merged.map((result) => [result.date, result])).values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);

    memoryRecentCache.set(cacheKey, unique);
    return unique;
  } catch {
    memoryRecentCache.set(cacheKey, fromMemory);
    return fromMemory;
  }
}
