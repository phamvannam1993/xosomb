import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import path from 'path';
import type { VietlottProductId, VietlottResult } from './types';

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

export async function readCachedVietlottResult(product: VietlottProductId, date: string) {
  const key = cacheKey(product, date);
  const memory = memoryCache.get(key);
  if (memory) return { ...memory, dataSource: 'cache' as const };
  if (!fileCacheEnabled()) return null;

  try {
    const raw = await readFile(cachePath(product, date), 'utf8');
    const parsed = JSON.parse(raw) as VietlottResult;
    memoryCache.set(key, parsed);
    return { ...parsed, dataSource: 'cache' as const };
  } catch {
    return null;
  }
}

export async function writeCachedVietlottResult(result: VietlottResult) {
  const key = cacheKey(result.product, result.date);
  memoryCache.set(key, result);
  if (!fileCacheEnabled()) return;

  const target = cachePath(result.product, result.date);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(result, null, 2), 'utf8');
}

export async function writeCachedVietlottResults(results: VietlottResult[]) {
  await Promise.all(results.map(writeCachedVietlottResult));
}

export async function readRecentCachedVietlottResults(product: VietlottProductId, limit = 30) {
  if (!fileCacheEnabled()) return [];

  try {
    const dir = path.join(CACHE_DIR, product);
    const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort().reverse().slice(0, limit);
    const results = await Promise.all(
      files.map(async (file) => {
        const raw = await readFile(path.join(dir, file), 'utf8');
        return JSON.parse(raw) as VietlottResult;
      })
    );
    return results.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  } catch {
    return [];
  }
}
