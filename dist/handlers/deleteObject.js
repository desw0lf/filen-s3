"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteObject = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
const validate_query_1 = require("../validate-query");
class DeleteObject {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(req, res, next) {
        try {
            const isQueryAllowed = (0, validate_query_1.validateQuery)(req.query, { "x-id": "DeleteObject" });
            if (!isQueryAllowed) {
                next();
                return;
            }
            const { path } = (0, utils_1.extractKeyAndBucketFromRequestParams)(req);
            if (!path) {
                await responses_1.default.noContent(res);
                return;
            }
            const object = await this.server.getObject(path);
            if (!object.exists) {
                await responses_1.default.noContent(res);
                return;
            }
            await this.server.sdk.fs().unlink({
                path,
                permanent: false
            });
            await responses_1.default.noContent(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "deleteObject");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.DeleteObject = DeleteObject;
exports.default = DeleteObject;
//# sourceMappingURL=deleteObject.js.map