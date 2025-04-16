"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certs = void 0;
const selfsigned_1 = __importDefault(require("selfsigned"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const write_file_atomic_1 = __importDefault(require("write-file-atomic"));
/**
 * Certs
 *
 * @export
 * @class Certs
 * @typedef {Certs}
 */
class Certs {
    /**
     * Get or generate the self signed SSL certificate.
     *
     * @public
     * @static
     * @async
     * @returns {Promise<{ cert: Buffer; privateKey: Buffer }>}
     */
    static async get() {
        await fs_extra_1.default.ensureDir(this.dirPath);
        const now = Date.now();
        const [certExists, privateKeyExists, expiryExists] = await Promise.all([
            fs_extra_1.default.exists(this.certPath),
            fs_extra_1.default.exists(this.privateKeyPath),
            fs_extra_1.default.exists(this.expiryPath)
        ]);
        if (certExists && privateKeyExists && expiryExists) {
            const expires = parseInt(await fs_extra_1.default.readFile(this.expiryPath, "utf8"));
            if (now > expires) {
                return {
                    cert: await fs_extra_1.default.readFile(this.certPath),
                    privateKey: await fs_extra_1.default.readFile(this.privateKeyPath)
                };
            }
        }
        const generated = selfsigned_1.default.generate([
            {
                name: "commonName",
                value: "local.s3.filen.io"
            }
        ], {
            days: 365,
            algorithm: "sha256",
            keySize: 2048
        });
        await Promise.all([
            (0, write_file_atomic_1.default)(this.certPath, generated.cert, "utf-8"),
            (0, write_file_atomic_1.default)(this.privateKeyPath, generated.private, "utf-8"),
            (0, write_file_atomic_1.default)(this.expiryPath, (now + 86400 * 360).toString(), "utf-8")
        ]);
        return {
            cert: Buffer.from(generated.cert, "utf-8"),
            privateKey: Buffer.from(generated.private, "utf-8")
        };
    }
}
exports.Certs = Certs;
_a = Certs;
Certs.dirPath = (0, utils_1.platformConfigPath)();
Certs.certPath = path_1.default.join(_a.dirPath, "cert");
Certs.privateKeyPath = path_1.default.join(_a.dirPath, "privateKey");
Certs.expiryPath = path_1.default.join(_a.dirPath, "expiry");
exports.default = Certs;
//# sourceMappingURL=certs.js.map