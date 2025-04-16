"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const aws4_express_1 = require("@filen/aws4-express");
class Auth {
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    handle(req, res, next) {
        (0, aws4_express_1.awsVerify)({
            onBeforeParse(req) {
                const authHeader = req.headers["authorization"] || req.headers["Authorization"];
                if (typeof authHeader === "string" && authHeader.length > 0) {
                    const normalizedHeader = authHeader.replace(/,(\S)/g, ", $1");
                    req.headers["Authorization"] = normalizedHeader;
                    req.headers["authorization"] = normalizedHeader;
                }
                return true;
            },
            onAfterParse(message, req) {
                req.bodyHash = message.bodyHash;
                return true;
            },
            secretKey: message => {
                if (message.accessKey === this.server.user.accessKeyId) {
                    return this.server.user.secretKeyId;
                }
                return undefined;
            }
        })(req, res, next).catch(next);
    }
}
exports.Auth = Auth;
exports.default = Auth;
//# sourceMappingURL=auth.js.map