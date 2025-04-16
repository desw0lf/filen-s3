"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListObjectsV2 = void 0;
const responses_1 = __importDefault(require("../responses"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
class ListObjectsV2 {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    parseQueryParams(req) {
        if (!req || !req.query) {
            throw new Error("Invalid request.");
        }
        return {
            prefix: typeof req.query["prefix"] === "string" && req.query["prefix"].length > 0 ? req.query["prefix"] : "",
            delimiter: typeof req.query["delimiter"] === "string" && req.query["delimiter"].length > 0 ? req.query["delimiter"] : ""
        };
    }
    /**
     * Normalize the prefix so we can properly use it in the SDK.
     *
     * @private
     * @param {string} prefix
     * @returns {string}
     */
    normalizePrefix(prefix) {
        let trimmed = decodeURIComponent(prefix).trim();
        if (trimmed.length === 0 || trimmed === "/" || trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.includes("../")) {
            return "/";
        }
        if (!trimmed.startsWith("/")) {
            trimmed = `/${trimmed}`;
        }
        // if (trimmed.endsWith("/")) {
        // 	trimmed = trimmed.substring(0, trimmed.length - 1)
        // }
        return trimmed;
    }
    /**
     * Read a cloud directory (recursively to a maximum depth).
     *
     * @private
     * @async
     * @param {string} path
     * @param {number} depth
     * @returns {Promise<string[]>}
     */
    async readdir(path, depth) {
        if (depth <= 0) {
            return await this.server.sdk.fs().readdir({ path });
        }
        const items = [];
        const traverse = async (currentPath, currentDepth) => {
            if (currentDepth >= depth) {
                return;
            }
            const dir = await this.server.sdk.fs().readdir({ path: currentPath });
            await (0, utils_1.promiseAllChunked)(dir.map(async (item) => {
                const itemPath = path_1.default.posix.join(currentPath, item);
                const stats = await this.server.sdk.fs().stat({ path: itemPath });
                items.push(itemPath.slice(path.length));
                if (stats.type === "directory") {
                    await traverse(itemPath, currentDepth + 1);
                }
            }));
        };
        await traverse(path, 0);
        return items;
    }
    async handle(req, res) {
        try {
            if (req.url.includes("?location")) {
                await responses_1.default.getBucketLocation(res);
                return;
            }
            if (!req.url.includes("prefix=")) {
                await responses_1.default.error(res, 400, "BadRequest", "Invalid prefix specified.");
                return;
            }
            const { bucket } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!bucket) {
                await responses_1.default.error(res, 404, "NoSuchBucket", "Bucket not found.");
                return;
            }
            const params = this.parseQueryParams(req);
            const normalizedPrefix = this.normalizePrefix(params.prefix);
            let dirname = this.normalizePrefix(normalizedPrefix === "/" ? `/${bucket}` : path_1.default.posix.dirname(path_1.default.posix.join(bucket, normalizedPrefix)));
            const requestedPath = this.normalizePrefix(path_1.default.posix.join(bucket, normalizedPrefix));
            const requestedPathStats = await this.server.getObject(requestedPath);
            if (requestedPathStats.exists && requestedPathStats.stats.type === "directory") {
                dirname = requestedPath;
            }
            const dirnameStats = await this.server.getObject(dirname);
            if (!dirnameStats.exists) {
                await responses_1.default.listObjectsV2(res, params.prefix, [], [], bucket, params.delimiter);
                return;
            }
            const topLevelDirContent = await this.readdir(dirname, params.delimiter.length === 0 ? 10 : 0);
            const topLevelItems = [];
            for (const item of topLevelDirContent) {
                const itemPath = this.normalizePrefix(path_1.default.posix.join(dirname, item));
                if (!itemPath.startsWith(this.normalizePrefix(path_1.default.posix.join(bucket, normalizedPrefix)))) {
                    continue;
                }
                topLevelItems.push(item);
            }
            const objects = (await (0, utils_1.promiseAllChunked)(topLevelItems.map(async (item) => {
                const path = path_1.default.posix.join(dirname, item);
                const stats = await this.server.sdk.fs().stat({ path });
                return Object.assign(Object.assign({}, stats), { path: path.startsWith(`/${bucket}/`) ? path.slice(`/${bucket}/`.length) : path });
            }))).sort((a, b) => a.path.length - b.path.length);
            const commonPrefixes = [];
            const finalObjects = [];
            for (const object of objects) {
                if (object.type === "directory") {
                    commonPrefixes.push(`${object.path}/`);
                    finalObjects.push(Object.assign(Object.assign({}, object), { path: `${object.path}/` }));
                }
                else {
                    finalObjects.push(object);
                }
            }
            await responses_1.default.listObjectsV2(res, normalizedPrefix === "/" ? "/" : normalizedPrefix.slice(1), finalObjects, commonPrefixes, bucket, params.delimiter);
        }
        catch (e) {
            this.server.logger.log("error", e, "listObjects");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.ListObjectsV2 = ListObjectsV2;
exports.default = ListObjectsV2;
//# sourceMappingURL=listObjects.js.map