import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'fs/promises';
import path from 'path';
import type { VietlottProductId, VietlottResult } from './types';
import { isFutureDate } from './format';
import { isValidVietlottResult } from './normalize';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'vietlott');

function fileCacheEnabled() {
  return process.env.VIETLOTT_FILE_CACHE !== 'false' && process.env.LOTTERY_FILE_CACHE !== 'false';
}

const memoryCache = new Map<string, VietlottResult>();

function cacheKey(product: VietlottProductId, date: string) {
  return `${product}:${date}`;
}

function cachePath(product: VietlottProductId, date: string) {
  return path.join(CACHE_DIR, product, `${date}.json`);
}

function isSafeCachedVietlottResult(result: VietlottResult | null | undefined, product?: VietlottProductId): result is VietlottResult {
  return Boolean(
    result &&
    isValidVietlottResult(result) &&
    !isFutureDate(result.date) &&
    (!product || result.product === product)
  );
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

export async function readCachedVietlottResult(product: VietlottProductId, date: string): Promise<VietlottResult | null> {
  const key = cacheKey(product, date);
  const memory = memoryCache.get(key);
  if (isSafeCachedVietlottResult(memory, product)) return { ...memory, dataSource: 'cache' as const };
  if (memory) memoryCache.delete(key);
  if (!fileCacheEnabled()) return null;

  try {
    const raw = await readFile(cachePath(product, date), 'utf8');
    const parsed = JSON.parse(raw) as VietlottResult;
    if (!isSafeCachedVietlottResult(parsed, product)) return null;
    memoryCache.set(key, parsed);
    return { ...parsed, dataSource: 'cache' as const };
  } catch {
    return null;
  }
}

export async function writeCachedVietlottResult(result: VietlottResult): Promise<void> {
  if (!isSafeCachedVietlottResult(result)) return;

  const key = cacheKey(result.product, result.date);
  memoryCache.set(key, result);
  if (!fileCacheEnabled()) return;

  try {
    const target = cachePath(result.product, result.date);
    await mkdir(path.dirname(target), { recursive: true });
    await writeJsonAtomically(target, result);
  } catch {
    // Cache lỗi không được làm hỏng trang.
  }
}

export async function writeCachedVietlottResults(results: VietlottResult[]): Promise<void> {
  await Promise.all(results.map(writeCachedVietlottResult));
}

export async function readRecentCachedVietlottResults(product: VietlottProductId, limit = 30): Promise<VietlottResult[]> {
  if (!fileCacheEnabled()) return [];

  try {
    const dir = path.join(CACHE_DIR, product);
    const files = (await readdir(dir)).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().reverse().slice(0, limit * 2);
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const raw = await readFile(path.join(dir, file), 'utf8');
          const parsed = JSON.parse(raw) as VietlottResult;
          return isSafeCachedVietlottResult(parsed, product) ? parsed : null;
        } catch {
          return null;
        }
      })
    );
    return (results.filter(Boolean) as VietlottResult[])
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  } catch {
    return [];
  }
}
