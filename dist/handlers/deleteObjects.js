"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteObjects = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const validate_query_1 = require("../validate-query");
class DeleteObjects {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res, next) {
        try {
            const isQueryAllowed = (0, validate_query_1.validateQuery)(req.query, { delete: { required: true, anyValue: true }, "x-id": "DeleteObjects" });
            if (!isQueryAllowed || typeof req.decodedBody === "undefined") {
                next();
                return;
            }
            const { bucket } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!bucket) {
                await responses_1.default.error(res, 404, "NoSuchBucket", "Bucket not found.");
                return;
            }
            const xml = await (0, utils_1.streamToXML)(stream_1.Readable.from(req.decodedBody));
            if (!xml || !xml.Delete || !xml.Delete.Object) {
                await responses_1.default.error(res, 400, "BadRequest", "Malformed XML request body.");
                return;
            }
            const objects = xml.Delete.Object;
            const deleted = [];
            const errors = [];
            await (0, utils_1.promiseAllSettledChunked)(objects.map(object => new Promise(resolve => {
                const path = path_1.default.posix.join(bucket, object.Key);
                const normalizedKey = path.startsWith("/") ? path.slice(1) : path;
                this.server
                    .getObject(path)
                    .then(obj => {
                    const key = `${normalizedKey}${obj.exists && obj.stats.type === "directory" ? "/" : ""}`;
                    if (!obj.exists) {
                        deleted.push({
                            Key: key
                        });
                        resolve();
                        return;
                    }
                    this.server.sdk
                        .fs()
                        .unlink({
                        path,
                        permanent: false
                    })
                        .then(() => {
                        deleted.push({
                            Key: key
                        });
                        resolve();
                    })
                        .catch(() => {
                        errors.push({
                            Key: key,
                            Code: "InternalError",
                            Message: "Internal server error."
                        });
                        resolve();
                    });
                })
                    .catch(() => {
                    errors.push({
                        Key: normalizedKey,
                        Code: "InternalError",
                        Message: "Internal server error."
                    });
                    resolve();
                });
            })));
            await responses_1.default.deleteObjects(res, deleted, errors);
        }
        catch (e) {
            this.server.logger.log("error", e, "deleteObjects");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.DeleteObjects = DeleteObjects;
exports.default = DeleteObjects;
//# sourceMappingURL=deleteObjects.js.map