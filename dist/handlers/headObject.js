"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadObject = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
const mime_types_1 = __importDefault(require("mime-types"));
const validate_query_1 = require("../validate-query");
class HeadObject {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res, next) {
        try {
            const isQueryAllowed = (0, validate_query_1.validateQuery)(req.query, { "x-id": "HeadObject" });
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
            res.set("Content-Type", mimeType);
            res.set("Accept-Ranges", "bytes");
            res.set("Last-Modified", new Date(object.stats.mtimeMs).toUTCString());
            res.set("E-Tag", `"${object.stats.uuid}"`);
            res.set("Content-Length", object.stats.size.toString());
            res.status(200);
            await new Promise(resolve => {
                res.end(() => {
                    resolve();
                });
            });
        }
        catch (e) {
            this.server.logger.log("error", e, "headObject");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.HeadObject = HeadObject;
exports.default = HeadObject;
//# sourceMappingURL=headObject.js.map