/// <reference types="node" />
/// <reference types="node" />
import { type Request } from "express";
import { type Readable } from "stream";
/**
 * Convert a UNIX style timestamp (in seconds) to milliseconds
 * @date 1/31/2024 - 4:10:35 PM
 *
 * @export
 * @param {number} timestamp
 * @returns {number}
 */
export declare function convertTimestampToMs(timestamp: number): number;
/**
 * Chunk large Promise.all executions.
 * @date 2/14/2024 - 11:59:34 PM
 *
 * @export
 * @async
 * @template T
 * @param {Promise<T>[]} promises
 * @param {number} [chunkSize=10000]
 * @returns {Promise<T[]>}
 */
export declare function promiseAllChunked<T>(promises: Promise<T>[], chunkSize?: number): Promise<T[]>;
/**
 * Return the platforms config path.
 *
 * @export
 * @returns {string}
 */
export declare function platformConfigPath(): string;
/**
 * Chunk large Promise.allSettled executions.
 * @date 3/5/2024 - 12:41:08 PM
 *
 * @export
 * @async
 * @template T
 * @param {Promise<T>[]} promises
 * @param {number} [chunkSize=10000]
 * @returns {Promise<T[]>}
 */
export declare function promiseAllSettledChunked<T>(promises: Promise<T>[], chunkSize?: number): Promise<T[]>;
/**
 * Parse the requested byte range from the header.
 *
 * @export
 * @param {string} range
 * @param {number} totalLength
 * @returns {({ start: number; end: number } | null)}
 */
export declare function parseByteRange(range: string, totalLength: number): {
    start: number;
    end: number;
} | null;
/**
 * Normalize an object key so we can use it in the SDK.
 *
 * @export
 * @param {string} key
 * @returns {string}
 */
export declare function normalizeKey(key: string): string;
/**
 * Extract the key and bucket parameter from the express router request.
 *
 * @export
 * @param {Request} req
 * @returns {({ bucket: string | null; key: string | null; path: string | null })}
 */
export declare function extractKeyAndBucketFromRequestParams(req: Request): {
    bucket: string | null;
    key: string | null;
    path: string | null;
};
/**
 * Read a readable stream into a Buffer.
 *
 * @export
 * @param {Readable} stream
 * @returns {Promise<Buffer>}
 */
export declare function streamToBuffer(stream: Readable): Promise<Buffer>;
/**
 * Parse a readable stream into XML.
 *
 * @export
 * @template T
 * @param {Readable} stream
 * @returns {Promise<T>}
 */
export declare function streamToXML<T>(stream: Readable): Promise<T>;
/**
 * Validates an S3 bucket name.
 * @param bucketName - The bucket name to validate.
 * @returns True if the bucket name is valid, otherwise false.
 */
export declare function isValidBucketName(bucketName: string): boolean;
/**
 * Validates an S3 object key.
 * @param key - The object key to validate.
 * @returns True if the key is valid, otherwise false.
 */
export declare function isValidObjectKey(key: string): boolean;
