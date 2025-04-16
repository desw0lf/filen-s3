"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBucket = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
class DeleteBucket {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res) {
        try {
            const { bucket } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!bucket) {
                await responses_1.default.noContent(res);
                return;
            }
            await this.server.sdk.fs().unlink({
                path: `/${bucket}`,
                permanent: false
            });
            await responses_1.default.noContent(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "deleteBucket");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.DeleteBucket = DeleteBucket;
exports.default = DeleteBucket;
//# sourceMappingURL=deleteBucket.js.map