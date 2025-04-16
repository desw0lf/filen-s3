"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.filenLogsPath = void 0;
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const rotating_file_stream_1 = require("rotating-file-stream");
async function filenLogsPath() {
    let configPath = "";
    switch (process.platform) {
        case "win32":
            configPath = path_1.default.resolve(process.env.APPDATA);
            break;
        case "darwin":
            configPath = path_1.default.resolve(path_1.default.join(os_1.default.homedir(), "Library/Application Support/"));
            break;
        default:
            configPath = process.env.XDG_CONFIG_HOME
                ? path_1.default.resolve(process.env.XDG_CONFIG_HOME)
                : path_1.default.resolve(path_1.default.join(os_1.default.homedir(), ".config/"));
            break;
    }
    if (!configPath || configPath.length === 0) {
        throw new Error("Could not find homedir path.");
    }
    configPath = path_1.default.join(configPath, "@filen", "logs");
    if (!(await fs_extra_1.default.exists(configPath))) {
        await fs_extra_1.default.mkdir(configPath, {
            recursive: true
        });
    }
    return configPath;
}
exports.filenLogsPath = filenLogsPath;
class Logger {
    constructor(disableLogging = false, isWorker = false) {
        this.logger = null;
        this.dest = null;
        this.isCleaning = false;
        this.disableLogging = disableLogging;
        this.isWorker = isWorker;
        this.init();
    }
    async init() {
        try {
            this.dest = path_1.default.join(await filenLogsPath(), this.isWorker ? "s3-worker.log" : "s3.log");
            this.logger = (0, pino_1.default)((0, rotating_file_stream_1.createStream)(path_1.default.basename(this.dest), {
                size: "10M",
                interval: "7d",
                compress: "gzip",
                encoding: "utf-8",
                maxFiles: 3,
                path: path_1.default.dirname(this.dest)
            }));
        }
        catch (e) {
            console.error(e);
        }
    }
    async waitForPino() {
        if (this.logger) {
            return;
        }
        await new Promise(resolve => {
            const wait = setInterval(() => {
                if (this.logger) {
                    clearInterval(wait);
                    resolve();
                }
            }, 100);
        });
    }
    log(level, object, where) {
        if (this.isCleaning || this.disableLogging) {
            return;
        }
        // eslint-disable-next-line no-extra-semi
        ;
        (async () => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                if (!this.logger) {
                    await this.waitForPino();
                }
                const log = `${where ? `[${where}] ` : ""}${typeof object !== "undefined"
                    ? typeof object === "string" || typeof object === "number"
                        ? object
                        : JSON.stringify(object)
                    : ""}`;
                if (level === "info") {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(log);
                }
                else if (level === "debug") {
                    (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug(log);
                }
                else if (level === "error") {
                    (_c = this.logger) === null || _c === void 0 ? void 0 : _c.error(log);
                    if (object instanceof Error) {
                        (_d = this.logger) === null || _d === void 0 ? void 0 : _d.error(object);
                    }
                }
                else if (level === "warn") {
                    (_e = this.logger) === null || _e === void 0 ? void 0 : _e.warn(log);
                }
                else if (level === "trace") {
                    (_f = this.logger) === null || _f === void 0 ? void 0 : _f.trace(log);
                }
                else if (level === "fatal") {
                    (_g = this.logger) === null || _g === void 0 ? void 0 : _g.fatal(log);
                }
                else {
                    (_h = this.logger) === null || _h === void 0 ? void 0 : _h.info(log);
                }
            }
            catch (e) {
                console.error(e);
            }
        })();
    }
}
exports.Logger = Logger;
exports.default = Logger;
//# sourceMappingURL=logger.js.map