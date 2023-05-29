import { Buffer } from 'buffer';
import {
  compress as compressZstd,
  decompress as decompressZstd,
} from '@mongodb-js/zstd';
import { compress as compressLz4, decompress as decompressLz4 } from 'lz4js';
import {
  compress as compressBrotli,
  decompress as decompressBrotli,
} from 'brotli-wasm';
import { createHash } from 'node:crypto';

export const bytesToMbs = (bytes: number) => Math.round(bytes / 10) / 100000;

export type CompressionAlgorithm = 'lz4' | 'brotli' | 'zstd';

export const compressStringLz4 = async (string: string) => {
  const stringBuffer = Buffer.from(string);

  return Buffer.from(compressLz4(stringBuffer));
};

export const compressStringBrotli = async (string: string) => {
  const stringBuffer = Buffer.from(string);

  return Buffer.from(compressBrotli(stringBuffer));
};

export const compressStringZstd = async (string: string, level = 9) => {
  const stringBuffer = Buffer.from(string);

  return await compressZstd(stringBuffer, level);
};

export const compressString = async (
  string: string | Buffer,
  algorithm: CompressionAlgorithm = 'lz4'
) => {
  const stringBuffer = string instanceof Buffer ? string : Buffer.from(string);

  switch (algorithm) {
    case 'brotli':
      return Buffer.from(compressBrotli(stringBuffer));
    case 'zstd':
      return Buffer.from(await compressZstd(stringBuffer));
    default:
      return Buffer.from(compressLz4(stringBuffer));
  }
};

export const decompressStringLz4 = async (compressed: Buffer) =>
  Buffer.from(decompressLz4(compressed)).toString('utf-8');

export const decompressStringBrotli = async (compressed: Buffer) =>
  Buffer.from(decompressBrotli(compressed)).toString('utf-8');

export const decompressStringZstd = async (compressed: Buffer) =>
  (await decompressZstd(compressed)).toString('utf-8');

export const decompressString = async (
  string: string | Buffer,
  algorithm: CompressionAlgorithm = 'lz4'
) => {
  const stringBuffer = string instanceof Buffer ? string : Buffer.from(string);

  switch (algorithm) {
    case 'brotli':
      return Buffer.from(decompressBrotli(stringBuffer)).toString('utf-8');
    case 'zstd':
      return (await decompressZstd(stringBuffer)).toString('utf-8');
    default:
      return Buffer.from(decompressLz4(stringBuffer)).toString('utf-8');
  }
};

const md5Hasher = createHash('md5');

export const md5Hash = (target: string | object) =>
  md5Hasher
    .update(typeof target === 'string' ? target : JSON.stringify(target))
    .digest('hex');
