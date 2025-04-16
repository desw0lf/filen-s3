"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3ServerCluster = exports.S3Server = void 0;
const express_1 = __importDefault(require("express"));
const sdk_1 = __importDefault(require("@filen/sdk"));
const https_1 = __importDefault(require("https"));
const certs_1 = __importDefault(require("./certs"));
const errors_1 = __importDefault(require("./middlewares/errors"));
const auth_1 = __importDefault(require("./middlewares/auth"));
const listBuckets_1 = __importDefault(require("./handlers/listBuckets"));
const listObjects_1 = __importDefault(require("./handlers/listObjects"));
const getObject_1 = __importDefault(require("./handlers/getObject"));
const headObject_1 = __importDefault(require("./handlers/headObject"));
const deleteObject_1 = __importDefault(require("./handlers/deleteObject"));
const putObject_1 = __importDefault(require("./handlers/putObject"));
const utils_1 = require("./utils");
const headBucket_1 = __importDefault(require("./handlers/headBucket"));
const deleteObjects_1 = __importDefault(require("./handlers/deleteObjects"));
const responses_1 = __importDefault(require("./responses"));
const semaphore_1 = require("./semaphore");
const http_1 = __importDefault(require("http"));
const uuid_1 = require("uuid");
const express_rate_limit_1 = require("express-rate-limit");
const logger_1 = __importDefault(require("./logger"));
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const createBucket_1 = __importDefault(require("./handlers/createBucket"));
const body_1 = __importDefault(require("./middlewares/body"));
const deleteBucket_1 = __importDefault(require("./handlers/deleteBucket"));
/**
 * S3Server
 *
 * @export
 * @class S3Server
 * @typedef {S3Server}
 */
class S3Server {
    /**
     * Creates an instance of S3Server.
     *
     * @constructor
     * @public
     * @param {{
     * 		hostname?: string
     * 		port?: number
     * 		https?: boolean
     * 		user: User
     * 		rateLimit?: RateLimit
     * 		disableLogging?: boolean
     * 	}} param0
     * @param {string} [param0.hostname="127.0.0.1"]
     * @param {number} [param0.port=1700]
     * @param {User} param0.user
     * @param {boolean} [param0.https=false]
     * @param {RateLimit} [param0.rateLimit={
     * 			windowMs: 1000,
     * 			limit: 1000,
     * 			key: "accessKeyId"
     * 		}]
     * @param {boolean} [param0.disableLogging=false]
     */
    constructor({ hostname = "127.0.0.1", port = 1700, user, https = false, rateLimit = {
        windowMs: 1000,
        limit: 1000,
        key: "accessKeyId"
    }, disableLogging = false }) {
        this.region = "filen";
        this.service = "s3";
        this.rwMutex = {};
        this.serverInstance = null;
        this.connections = {};
        this.serverConfig = {
            hostname,
            port,
            https
        };
        this.rateLimit = rateLimit;
        this.logger = new logger_1.default(disableLogging, false);
        if (!user.sdk && !user.sdkConfig) {
            throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
        }
        if (user.sdk) {
            this.sdk = user.sdk;
            this.user = Object.assign(Object.assign({}, user), { sdkConfig: user.sdk.config, sdk: this.sdk });
        }
        else if (user.sdkConfig) {
            this.sdk = new sdk_1.default(Object.assign(Object.assign({}, user.sdkConfig), { connectToSocket: true, metadataCache: true }));
            this.user = Object.assign(Object.assign({}, user), { sdkConfig: user.sdkConfig, sdk: this.sdk });
        }
        else {
            throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
        }
        this.server = (0, express_1.default)();
        this.sdk.socket.on("socketEvent", (event) => {
            if (event.type === "passwordChanged") {
                this.user.sdk = undefined;
                this.user.sdkConfig = undefined;
                this.stop(true).catch(() => { });
            }
        });
    }
    /**
     * Get a read/write mutex for a path.
     *
     * @public
     * @param {string} path
     * @returns {ISemaphore}
     */
    getRWMutex(path) {
        if (!this.rwMutex[path]) {
            this.rwMutex[path] = new semaphore_1.Semaphore(1);
        }
        return this.rwMutex[path];
    }
    /**
     * Get object stats.
     *
     * @public
     * @async
     * @param {string} key
     * @returns {Promise<{ exists: false } | { exists: true; stats: FSStats }>}
     */
    async getObject(key) {
        try {
            const stats = await this.sdk.fs().stat({ path: (0, utils_1.normalizeKey)(key) });
            return {
                exists: true,
                stats
            };
        }
        catch (_a) {
            return {
                exists: false
            };
        }
    }
    /**
     * Start the server.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async start() {
        if (!this.user.sdk && !this.user.sdkConfig) {
            throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
        }
        this.connections = {};
        this.server.disable("x-powered-by");
        this.server.use((0, express_rate_limit_1.rateLimit)({
            windowMs: this.rateLimit.windowMs,
            limit: this.rateLimit.limit,
            standardHeaders: "draft-7",
            legacyHeaders: true,
            keyGenerator: req => {
                var _a, _b, _c, _d, _e;
                if (this.rateLimit.key === "ip") {
                    return (_a = req.ip) !== null && _a !== void 0 ? _a : "ip";
                }
                const authHeader = req.headers["authorization"];
                if (!authHeader) {
                    return (_b = req.ip) !== null && _b !== void 0 ? _b : "ip";
                }
                const match = authHeader.match(/AWS4-HMAC-SHA256\s*Credential=([^,]+),\s*SignedHeaders=([^,]+),\s*Signature=([a-fA-F0-9]+)/);
                if (!match) {
                    return (_c = req.ip) !== null && _c !== void 0 ? _c : "ip";
                }
                const [, credential] = match;
                if (!credential) {
                    return (_d = req.ip) !== null && _d !== void 0 ? _d : "ip";
                }
                const [accessKeyId] = credential.split("/");
                if (!accessKeyId) {
                    return (_e = req.ip) !== null && _e !== void 0 ? _e : "ip";
                }
                return accessKeyId;
            }
        }));
        this.server.use(body_1.default);
        this.server.use(new auth_1.default(this).handle);
        this.server.head("/:bucket/:key*", new headObject_1.default(this).handle);
        this.server.get("/:bucket/:key*", new getObject_1.default(this).handle);
        this.server.delete("/:bucket/:key*", new deleteObject_1.default(this).handle);
        this.server.put("/:bucket/:key*", new putObject_1.default(this).handle);
        this.server.head("/:bucket", new headBucket_1.default(this).handle);
        this.server.put("/:bucket", new createBucket_1.default(this).handle);
        this.server.delete("/:bucket", new deleteBucket_1.default(this).handle);
        this.server.get("/:bucket", new listObjects_1.default(this).handle);
        this.server.post("/:bucket", new deleteObjects_1.default(this).handle);
        this.server.get("/", new listBuckets_1.default(this).handle);
        this.server.use((_, res) => {
            responses_1.default.error(res, 501, "NotImplemented", "The requested method is not implemented.").catch(() => { });
        });
        this.server.use(errors_1.default);
        await new Promise((resolve, reject) => {
            if (this.serverConfig.https) {
                certs_1.default.get()
                    .then(certs => {
                    this.serverInstance = https_1.default
                        .createServer({
                        cert: certs.cert,
                        key: certs.privateKey
                    }, this.server)
                        .listen(this.serverConfig.port, this.serverConfig.hostname, () => {
                        this.serverInstance.setTimeout(86400000 * 7);
                        this.serverInstance.timeout = 86400000 * 7;
                        this.serverInstance.keepAliveTimeout = 86400000 * 7;
                        this.serverInstance.headersTimeout = 86400000 * 7 * 2;
                        resolve();
                    })
                        .on("connection", socket => {
                        const socketId = (0, uuid_1.v4)();
                        this.connections[socketId] = socket;
                        socket.once("close", () => {
                            delete this.connections[socketId];
                        });
                    });
                })
                    .catch(reject);
            }
            else {
                this.serverInstance = http_1.default
                    .createServer(this.server)
                    .listen(this.serverConfig.port, this.serverConfig.hostname, () => {
                    this.serverInstance.setTimeout(86400000 * 7);
                    this.serverInstance.timeout = 86400000 * 7;
                    this.serverInstance.keepAliveTimeout = 86400000 * 7;
                    this.serverInstance.headersTimeout = 86400000 * 7 * 2;
                    resolve();
                })
                    .on("connection", socket => {
                    const socketId = (0, uuid_1.v4)();
                    this.connections[socketId] = socket;
                    socket.once("close", () => {
                        delete this.connections[socketId];
                    });
                });
            }
        });
    }
    /**
     * Stop the server.
     *
     * @public
     * @async
     * @param {boolean} [terminate=false]
     * @returns {Promise<void>}
     */
    async stop(terminate = false) {
        await new Promise((resolve, reject) => {
            var _a;
            if (!this.serverInstance) {
                resolve();
                return;
            }
            this.serverInstance.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
            if (terminate) {
                for (const socketId in this.connections) {
                    try {
                        (_a = this.connections[socketId]) === null || _a === void 0 ? void 0 : _a.destroy();
                        delete this.connections[socketId];
                    }
                    catch (_b) {
                        // Noop
                    }
                }
            }
        });
    }
}
exports.S3Server = S3Server;
class S3ServerCluster {
    constructor({ hostname = "127.0.0.1", port = 1700, user, https = false, rateLimit = {
        windowMs: 1000,
        limit: 1000,
        key: "accessKeyId"
    }, threads }) {
        this.workers = {};
        this.stopSpawning = false;
        this.serverConfig = {
            hostname,
            port,
            https
        };
        this.rateLimit = rateLimit;
        this.user = user;
        this.threads = typeof threads === "number" ? threads : os_1.default.cpus().length;
        this.enableHTTPS = https;
        if (!this.user.sdk && !this.user.sdkConfig) {
            throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
        }
        if (this.user.sdk) {
            this.sdk = this.user.sdk;
        }
        else {
            this.sdk = new sdk_1.default(Object.assign(Object.assign({}, this.user.sdkConfig), { connectToSocket: true, metadataCache: true }));
        }
        this.sdk.socket.on("socketEvent", (event) => {
            if (event.type === "passwordChanged") {
                this.user.sdk = undefined;
                this.user.sdkConfig = undefined;
                this.stop().catch(() => { });
            }
        });
    }
    /**
     * Spawn a worker.
     *
     * @private
     */
    spawnWorker() {
        if (this.stopSpawning) {
            return;
        }
        const worker = cluster_1.default.fork();
        this.workers[worker.id] = {
            worker,
            ready: false
        };
    }
    /**
     * Fork all needed threads.
     *
     * @private
     * @async
     * @returns {Promise<"master" | "worker">}
     */
    async startCluster() {
        if (cluster_1.default.isPrimary) {
            return await new Promise((resolve, reject) => {
                try {
                    let workersReady = 0;
                    for (let i = 0; i < this.threads; i++) {
                        this.spawnWorker();
                    }
                    cluster_1.default.on("exit", async (worker) => {
                        if (workersReady < this.threads) {
                            return;
                        }
                        workersReady--;
                        delete this.workers[worker.id];
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        try {
                            this.spawnWorker();
                        }
                        catch (_a) {
                            // Noop
                        }
                    });
                    const errorTimeout = setTimeout(() => {
                        reject(new Error("Could not spawn all workers."));
                    }, 15000);
                    cluster_1.default.on("message", (worker, message) => {
                        if (message === "ready" && this.workers[worker.id]) {
                            workersReady++;
                            this.workers[worker.id].ready = true;
                            if (workersReady >= this.threads) {
                                clearTimeout(errorTimeout);
                                resolve("master");
                            }
                        }
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        const server = new S3Server({
            hostname: this.serverConfig.hostname,
            port: this.serverConfig.port,
            disableLogging: true,
            user: this.user,
            rateLimit: this.rateLimit,
            https: this.enableHTTPS
        });
        await server.start();
        if (process.send) {
            process.send("ready");
        }
        return "worker";
    }
    /**
     * Start the S3 cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async start() {
        if (!this.user.sdk && !this.user.sdkConfig) {
            throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
        }
        await new Promise((resolve, reject) => {
            this.startCluster()
                .then(type => {
                if (type === "master") {
                    resolve();
                }
            })
                .catch(reject);
        });
    }
    /**
     * Stop the S3 cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async stop() {
        cluster_1.default.removeAllListeners();
        this.stopSpawning = true;
        for (const id in this.workers) {
            this.workers[id].worker.destroy();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.workers = {};
        this.stopSpawning = false;
    }
}
exports.S3ServerCluster = S3ServerCluster;
exports.default = S3Server;
//# sourceMappingURL=index.js.map