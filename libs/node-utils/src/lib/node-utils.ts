import { Buffer } from 'buffer';
import { compress as compressLz4, decompress as decompressLz4 } from 'lz4js';
import {
  compress as compressBrotli,
  decompress as decompressBrotli,
} from 'brotli-wasm';

export const bytesToMbs = (bytes: number) => Math.round(bytes / 10) / 100000;

export type CompressionAlgorithm = 'lz4' | 'brotli';

export const compressStringLz4 = async (string: string) => {
  const stringBuffer = Buffer.from(string);

  return Buffer.from(compressLz4(stringBuffer));
};

export const compressStringBrotli = async (string: string) => {
  const stringBuffer = Buffer.from(string);

  return Buffer.from(compressBrotli(stringBuffer));
};

export const compressString = async (
  string: string | Buffer,
  algorithm: CompressionAlgorithm = 'lz4'
) => {
  const stringBuffer = string instanceof Buffer ? string : Buffer.from(string);

  switch (algorithm) {
    case 'brotli':
      return Buffer.from(compressBrotli(stringBuffer));
    default:
      return Buffer.from(compressLz4(stringBuffer));
  }
};

export const decompressStringLz4 = async (compressed: Buffer) =>
  Buffer.from(decompressLz4(compressed)).toString('utf-8');

export const decompressStringBrotli = async (compressed: Buffer) =>
  Buffer.from(decompressBrotli(compressed)).toString('utf-8');

export const decompressString = async (
  string: string | Buffer,
  algorithm: CompressionAlgorithm = 'lz4'
) => {
  const stringBuffer = string instanceof Buffer ? string : Buffer.from(string);

  switch (algorithm) {
    case 'brotli':
      return Buffer.from(decompressBrotli(stringBuffer)).toString('utf-8');
    default:
      return Buffer.from(decompressLz4(stringBuffer)).toString('utf-8');
  }
};
