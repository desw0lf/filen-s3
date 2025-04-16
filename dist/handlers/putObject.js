"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PutObject = void 0;
const responses_1 = __importDefault(require("../responses"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const stream_1 = require("stream");
const validate_query_1 = require("../validate-query");
class PutObject {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async copy(req, res) {
        const copySource = req.headers["x-amz-copy-source"];
        if (typeof copySource !== "string" || copySource.length === 0) {
            await responses_1.default.error(res, 400, "BadRequest", "Invalid copy source.");
            return;
        }
        const { key, bucket, path } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
        if (!key || !bucket || !path || !(0, utils_1.isValidObjectKey)(key)) {
            await responses_1.default.error(res, 400, "BadRequest", "Invalid key specified.");
            return;
        }
        const copySourceNormalized = (0, utils_1.normalizeKey)(decodeURIComponent(copySource));
        const copyObject = await this.server.getObject(copySourceNormalized);
        if (!copyObject.exists || copyObject.stats.type === "directory") {
            await responses_1.default.error(res, 412, "PreconditionFailed", "Copy source does not exist.");
            return;
        }
        const parentPath = path_1.default.posix.dirname(path);
        await this.server.sdk.fs().mkdir({ path: parentPath });
        const thisObject = await this.server.getObject(path);
        if (thisObject.exists) {
            await this.server.sdk.fs().unlink({
                path,
                permanent: false
            });
        }
        await this.server.sdk.fs().copy({
            from: copySourceNormalized,
            to: path
        });
        await this.server.sdk.fs().readdir({ path: parentPath });
        const copiedStats = await this.server.getObject(path);
        if (!copiedStats.exists || copiedStats.stats.type === "directory") {
            await responses_1.default.error(res, 500, "InternalError", "Internal server error.");
            return;
        }
        await responses_1.default.copyObject(res, {
            eTag: copiedStats.stats.uuid,
            lastModified: copiedStats.stats.lastModified
        });
    }
    async mkdir(req, res) {
        const { key, path } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
        if (!key || !path || !(0, utils_1.isValidObjectKey)(key)) {
            await responses_1.default.error(res, 400, "BadRequest", "Invalid key specified.");
            return;
        }
        const thisObject = await this.server.getObject(path);
        if (thisObject.exists) {
            await responses_1.default.ok(res);
            return;
        }
        await this.server.sdk.fs().mkdir({ path });
        await this.server.sdk.fs().readdir({ path: path_1.default.posix.dirname(path) });
        await responses_1.default.ok(res);
    }
    async handle(req, res, next) {
        try {
            const isQueryAllowed = (0, validate_query_1.validateQuery)(req.query, { "x-id": "PutObject" });
            if (!isQueryAllowed) {
                next();
                return;
            }
            const { key, bucket, path } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!key || !bucket || !path || !(0, utils_1.isValidObjectKey)(key)) {
                await responses_1.default.error(res, 400, "BadRequest", "Invalid key specified.");
                return;
            }
            const isCopy = typeof req.headers["x-amz-copy-source"] === "string" && req.headers["x-amz-copy-source"].length > 0;
            if (isCopy) {
                await this.copy(req, res);
                return;
            }
            if (req.url.trim().endsWith("/") && (req.bodySize === 0 || !req.decodedBody)) {
                await this.mkdir(req, res);
                return;
            }
            if (req.bodySize === 0 || !req.decodedBody) {
                await responses_1.default.error(res, 400, "BadRequest", "Invalid body.");
                return;
            }
            const parentPath = path_1.default.posix.dirname(path);
            const name = path_1.default.posix.basename(path);
            await this.server.sdk.fs().mkdir({ path: parentPath });
            const parentObject = await this.server.getObject(parentPath);
            if (!parentObject.exists || parentObject.stats.type !== "directory") {
                await responses_1.default.error(res, 412, "PreconditionFailed", "Parent directory does not exist.");
                return;
            }
            const thisObject = await this.server.getObject(path);
            if (thisObject.exists) {
                await this.server.sdk.fs().unlink({
                    path,
                    permanent: false
                });
            }
            const now = Date.now();
            let lastModified = typeof req.headers["x-amz-meta-mtime"] === "string" && req.headers["x-amz-meta-mtime"].length > 0
                ? (0, utils_1.convertTimestampToMs)(parseInt(req.headers["x-amz-meta-mtime"]))
                : now;
            let creation = typeof req.headers["x-amz-meta-creation-time"] === "string" && req.headers["x-amz-meta-creation-time"].length > 0
                ? (0, utils_1.convertTimestampToMs)(parseInt(req.headers["x-amz-meta-creation-time"]))
                : now;
            if (lastModified >= now) {
                lastModified = now;
            }
            if (creation >= now) {
                creation = now;
            }
            let didError = false;
            const item = await this.server.sdk.cloud().uploadLocalFileStream({
                source: stream_1.Readable.from(req.decodedBody),
                parent: parentObject.stats.uuid,
                name,
                lastModified,
                creation,
                onError: () => {
                    didError = true;
                    responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
                }
            });
            if (didError) {
                return;
            }
            if (item.type !== "file") {
                await responses_1.default.error(res, 500, "InternalError", "Internal server error.");
                return;
            }
            await this.server.sdk.fs().readdir({ path: parentPath });
            res.set("E-Tag", `"${item.uuid}"`);
            res.set("Last-Modified", new Date(item.lastModified).toUTCString());
            await responses_1.default.ok(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "putObject");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.PutObject = PutObject;
exports.default = PutObject;
//# sourceMappingURL=putObject.js.map