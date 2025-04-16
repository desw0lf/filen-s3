"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadBucket = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
class HeadBucket {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res) {
        try {
            const { bucket } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!bucket) {
                await responses_1.default.error(res, 404, "NoSuchBucket", "Bucket not found.");
                return;
            }
            const object = await this.server.getObject((0, utils_1.normalizeKey)(bucket));
            if (!object.exists || object.stats.type !== "directory") {
                await responses_1.default.error(res, 404, "NoSuchBucket", "Bucket not found.");
                return;
            }
            res.set("x-amz-bucket-region", this.server.region);
            res.set("Content-Length", "0");
            res.status(200);
            await new Promise(resolve => {
                res.end(() => {
                    resolve();
                });
            });
        }
        catch (e) {
            this.server.logger.log("error", e, "headBucket");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.HeadBucket = HeadBucket;
exports.default = HeadBucket;
//# sourceMappingURL=headBucket.js.map