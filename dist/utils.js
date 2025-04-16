"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectKey = exports.isValidBucketName = exports.streamToXML = exports.streamToBuffer = exports.extractKeyAndBucketFromRequestParams = exports.normalizeKey = exports.parseByteRange = exports.promiseAllSettledChunked = exports.platformConfigPath = exports.promiseAllChunked = exports.convertTimestampToMs = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const xml2js_1 = require("xml2js");
/**
 * Convert a UNIX style timestamp (in seconds) to milliseconds
 * @date 1/31/2024 - 4:10:35 PM
 *
 * @export
 * @param {number} timestamp
 * @returns {number}
 */
function convertTimestampToMs(timestamp) {
    const now = Date.now();
    if (Math.abs(now - timestamp) < Math.abs(now - timestamp * 1000)) {
        return timestamp;
    }
    return Math.floor(timestamp * 1000);
}
exports.convertTimestampToMs = convertTimestampToMs;
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
async function promiseAllChunked(promises, chunkSize = 10000) {
    const results = [];
    for (let i = 0; i < promises.length; i += chunkSize) {
        const chunkResults = await Promise.all(promises.slice(i, i + chunkSize));
        results.push(...chunkResults);
    }
    return results;
}
exports.promiseAllChunked = promiseAllChunked;
/**
 * Return the platforms config path.
 *
 * @export
 * @returns {string}
 */
function platformConfigPath() {
    // Ref: https://github.com/FilenCloudDienste/filen-cli/blob/main/src/util.ts
    let configPath = "";
    switch (process.platform) {
        case "win32":
            configPath = path_1.default.resolve(process.env.APPDATA);
            break;
        case "darwin":
            configPath = path_1.default.resolve(path_1.default.join(os_1.default.homedir(), "Library/Application Support/"));
            break;
        default:
            configPath = process.env.XDG_CONFIG_HOME
                ? path_1.default.resolve(process.env.XDG_CONFIG_HOME)
                : path_1.default.resolve(path_1.default.join(os_1.default.homedir(), ".config/"));
            break;
    }
    if (!configPath || configPath.length === 0) {
        throw new Error("Could not find homedir path.");
    }
    configPath = path_1.default.join(configPath, "@filen", "s3");
    if (!fs_extra_1.default.existsSync(configPath)) {
        fs_extra_1.default.mkdirSync(configPath, {
            recursive: true
        });
    }
    return configPath;
}
exports.platformConfigPath = platformConfigPath;
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
async function promiseAllSettledChunked(promises, chunkSize = 10000) {
    const results = [];
    for (let i = 0; i < promises.length; i += chunkSize) {
        const chunkPromisesSettled = await Promise.allSettled(promises.slice(i, i + chunkSize));
        const chunkResults = chunkPromisesSettled.reduce((acc, current) => {
            if (current.status === "fulfilled") {
                acc.push(current.value);
            }
            else {
                // Handle rejected promises or do something with the error (current.reason)
            }
            return acc;
        }, []);
        results.push(...chunkResults);
    }
    return results;
}
exports.promiseAllSettledChunked = promiseAllSettledChunked;
/**
 * Parse the requested byte range from the header.
 *
 * @export
 * @param {string} range
 * @param {number} totalLength
 * @returns {({ start: number; end: number } | null)}
 */
function parseByteRange(range, totalLength) {
    const [unit, rangeValue] = range.split("=");
    if (unit !== "bytes" || !rangeValue) {
        return null;
    }
    const [startStr, endStr] = rangeValue.split("-");
    if (!startStr) {
        return null;
    }
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : totalLength - 1;
    if (isNaN(start) || isNaN(end) || start < 0 || end >= totalLength || start > end) {
        return null;
    }
    return {
        start,
        end
    };
}
exports.parseByteRange = parseByteRange;
/**
 * Normalize an object key so we can use it in the SDK.
 *
 * @export
 * @param {string} key
 * @returns {string}
 */
function normalizeKey(key) {
    key = key.trim();
    if (key.length === 0 || key === "./" || key === "../" || key === "/") {
        return "/";
    }
    if (!key.startsWith("/")) {
        key = `/${key}`;
    }
    if (key.endsWith("/")) {
        key = key.substring(0, key.length - 1);
    }
    return key;
}
exports.normalizeKey = normalizeKey;
/**
 * Extract the key and bucket parameter from the express router request.
 *
 * @export
 * @param {Request} req
 * @returns {({ bucket: string | null; key: string | null; path: string | null })}
 */
function extractKeyAndBucketFromRequestParams(req) {
    const key = typeof req.params.key === "string" && req.params.key.length > 0
        ? typeof req.params["0"] === "string" && req.params["0"].length > 0
            ? path_1.default.posix.join(decodeURIComponent(req.params.key), decodeURIComponent(req.params["0"]))
            : decodeURIComponent(req.params.key)
        : null;
    const bucket = typeof req.params.bucket === "string" && req.params.bucket.length > 0 && !req.params.bucket.includes("/")
        ? decodeURIComponent(req.params.bucket)
        : null;
    return {
        key,
        bucket,
        path: key && bucket ? normalizeKey(path_1.default.posix.join(bucket, key)) : null
    };
}
exports.extractKeyAndBucketFromRequestParams = extractKeyAndBucketFromRequestParams;
/**
 * Read a readable stream into a Buffer.
 *
 * @export
 * @param {Readable} stream
 * @returns {Promise<Buffer>}
 */
function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const buffers = [];
        stream.on("data", chunk => {
            buffers.push(chunk);
        });
        stream.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
        stream.on("error", reject);
    });
}
exports.streamToBuffer = streamToBuffer;
/**
 * Parse a readable stream into XML.
 *
 * @export
 * @template T
 * @param {Readable} stream
 * @returns {Promise<T>}
 */
function streamToXML(stream) {
    return new Promise((resolve, reject) => {
        streamToBuffer(stream)
            .then(requestBuffer => {
            (0, xml2js_1.parseString)(requestBuffer.toString("utf-8"), { explicitArray: false }, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        })
            .catch(reject);
    });
}
exports.streamToXML = streamToXML;
/**
 * Validates an S3 bucket name.
 * @param bucketName - The bucket name to validate.
 * @returns True if the bucket name is valid, otherwise false.
 */
function isValidBucketName(bucketName) {
    // Bucket name must be between 3 and 63 characters
    if (bucketName.length < 3 || bucketName.length > 63) {
        return false;
    }
    // Bucket name can only contain lowercase letters, numbers, hyphens, and periods
    const bucketNameRegex = /^[a-z0-9.-]+$/;
    if (!bucketNameRegex.test(bucketName)) {
        return false;
    }
    // Bucket name must start and end with a letter or number
    if (!/^[a-z0-9]/.test(bucketName) || !/[a-z0-9]$/.test(bucketName)) {
        return false;
    }
    // Consecutive periods are not allowed
    if (bucketName.includes("..")) {
        return false;
    }
    // Bucket name cannot be formatted as an IP address
    const ipAddressRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (ipAddressRegex.test(bucketName)) {
        return false;
    }
    return true;
}
exports.isValidBucketName = isValidBucketName;
/**
 * Validates an S3 object key.
 * @param key - The object key to validate.
 * @returns True if the key is valid, otherwise false.
 */
function isValidObjectKey(key) {
    // Key must not be empty
    if (key.length === 0) {
        return false;
    }
    // Key length must be between 1 and 1024 characters
    if (key.length > 1024) {
        return false;
    }
    // Key must not contain unprintable ASCII characters (ASCII 0-31) or delete (ASCII 127)
    // eslint-disable-next-line no-control-regex
    const controlCharsRegex = /[\x00-\x1F\x7F]/;
    if (controlCharsRegex.test(key)) {
        return false;
    }
    // Key must not contain invalid Unicode surrogates
    try {
        decodeURIComponent(encodeURIComponent(key)); // Validates UTF-8 encoding
    }
    catch (_a) {
        return false;
    }
    return true;
}
exports.isValidObjectKey = isValidObjectKey;
//# sourceMappingURL=utils.js.map