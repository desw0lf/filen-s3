"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBuckets = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
class ListBuckets {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async handle(_, res) {
        try {
            const topLevelItems = await this.server.sdk.fs().readdir({ path: "/" });
            const objects = (await (0, utils_1.promiseAllChunked)(topLevelItems.map(item => new Promise((resolve, reject) => {
                this.server.sdk
                    .fs()
                    .stat({ path: `/${item}` })
                    .then(stats => {
                    resolve(Object.assign(Object.assign({}, stats), { path: `/${item}` }));
                })
                    .catch(reject);
            })))).sort((a, b) => a.path.length - b.path.length);
            const buckets = objects
                .filter(object => object.type === "directory" && (0, utils_1.isValidBucketName)(object.name))
                .map(object => ({
                name: object.name,
                creationDate: object.birthtimeMs
            }));
            await responses_1.default.listBuckets(res, buckets, {
                id: this.server.user.accessKeyId,
                displayName: this.server.user.accessKeyId
            });
        }
        catch (e) {
            this.server.logger.log("error", e, "listBuckets");
            this.server.logger.log("error", e);
            responses_1.default.error(res, 500, "InternalError", "Internal server error.").catch(() => { });
        }
    }
}
exports.ListBuckets = ListBuckets;
exports.default = ListBuckets;
//# sourceMappingURL=listBuckets.js.map