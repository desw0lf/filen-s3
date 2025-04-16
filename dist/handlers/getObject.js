"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetObject = void 0;
const responses_1 = __importDefault(require("../responses"));
const stream_1 = require("stream");
const mime_types_1 = __importDefault(require("mime-types"));
const utils_1 = require("../utils");
const validate_query_1 = require("../validate-query");
class GetObject {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res, next) {
        try {
            const isQueryAllowed = (0, validate_query_1.validateQuery)(req.query, { "x-id": "GetObject" });
            if (!isQueryAllowed) {
                next();
                return;
            }
            const { key, bucket, path } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!key || !bucket || !path) {
                await responses_1.default.error(res, 404, "NoSuchKey", "The specified key does not exist.");
                return;
            }
            const object = await this.server.getObject(path);
            if (!object.exists || object.stats.type === "directory") {
                await responses_1.default.error(res, 404, "NoSuchKey", "The specified key does not exist.");
                return;
            }
            const mimeType = mime_types_1.default.lookup(object.stats.name) || "application/octet-stream";
            const totalLength = object.stats.size;
            const range = req.headers.range || req.headers["content-range"];
            let start = 0;
            let end = totalLength - 1;
            if (range) {
                const parsedRange = (0, utils_1.parseByteRange)(range, totalLength);
                if (!parsedRange) {
                    await responses_1.default.badRequest(res);
                    return;
                }
                start = parsedRange.start;
                end = parsedRange.end;
                res.status(206);
                res.set("Content-Range", `bytes ${start}-${end}/${totalLength}`);
                res.set("Content-Length", (end - start + 1).toString());
            }
            else {
                res.status(200);
                res.set("Content-Length", object.stats.size.toString());
            }
            res.set("Content-Disposition", `attachment; filename="${object.stats.name}"`);
            res.set("Content-Type", mimeType);
            res.set("Accept-Ranges", "bytes");
            res.set("Last-Modified", new Date(object.stats.mtimeMs).toUTCString());
            res.set("E-Tag", `"${object.stats.uuid}"`);
            const stream = this.server.sdk.cloud().downloadFileToReadableStream({
                uuid: object.stats.uuid,
                bucket: object.stats.bucket,
                region: object.stats.region,
                version: object.stats.version,
                key: object.stats.key,
                size: object.stats.size,
                chunks: object.stats.chunks,
                start,
                end
            });
            const nodeStream = stream_1.Readable.fromWeb(stream);
            const cleanup = () => {
                try {
                    stream.cancel().catch(() => { });
                    if (!nodeStream.closed && !nodeStream.destroyed) {
                        nodeStream.destroy();
                    }
                }
                catch (_a) {
                    // Noop
                }
            };
            res.once("close", () => {
                cleanup();
            });
            res.once("error", () => {
                cleanup();
            });
            res.once("finish", () => {
                cleanup();
            });
            req.once("close", () => {
                cleanup();
            });
            req.once("error", () => {
                cleanup();
            });
            nodeStream.once("error", () => {
                cleanup();
            });
            nodeStream.pipe(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "getObject");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.GetObject = GetObject;
exports.default = GetObject;
//# sourceMappingURL=getObject.js.map