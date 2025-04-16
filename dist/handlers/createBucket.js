"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBucket = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
class CreateBucket {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res) {
        try {
            const { bucket } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!bucket || !(0, utils_1.isValidBucketName)(bucket)) {
                await responses_1.default.error(res, 400, "BadRequest", "Invalid bucket specified.");
                return;
            }
            await this.server.sdk.fs().mkdir({ path: (0, utils_1.normalizeKey)(bucket) });
            await responses_1.default.ok(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "createBucket");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.CreateBucket = CreateBucket;
exports.default = CreateBucket;
//# sourceMappingURL=createBucket.js.map