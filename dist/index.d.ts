/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { type Express } from "express";
import FilenSDK, { type FilenSDKConfig, type FSStats } from "@filen/sdk";
import https from "https";
import { ISemaphore } from "./semaphore";
import http, { type IncomingMessage, type ServerResponse } from "http";
import { type Socket } from "net";
import { type Duplex } from "stream";
import Logger from "./logger";
export type ServerConfig = {
    hostname: string;
    port: number;
    https: boolean;
};
export type User = {
    sdkConfig?: FilenSDKConfig;
    accessKeyId: string;
    secretKeyId: string;
    sdk?: FilenSDK;
};
export type RateLimit = {
    windowMs: number;
    limit: number;
    key: "ip" | "accessKeyId";
};
/**
 * S3Server
 *
 * @export
 * @class S3Server
 * @typedef {S3Server}
 */
export declare class S3Server {
    readonly server: Express;
    readonly serverConfig: ServerConfig;
    readonly user: User;
    readonly sdk: FilenSDK;
    readonly region = "filen";
    readonly service = "s3";
    private readonly rwMutex;
    serverInstance: https.Server<typeof IncomingMessage, typeof ServerResponse> | http.Server<typeof IncomingMessage, typeof ServerResponse> | null;
    connections: Record<string, Socket | Duplex>;
    rateLimit: RateLimit;
    logger: Logger;
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
    constructor({ hostname, port, user, https, rateLimit, disableLogging }: {
        hostname?: string;
        port?: number;
        https?: boolean;
        user: User;
        rateLimit?: RateLimit;
        disableLogging?: boolean;
    });
    /**
     * Get a read/write mutex for a path.
     *
     * @public
     * @param {string} path
     * @returns {ISemaphore}
     */
    getRWMutex(path: string): ISemaphore;
    /**
     * Get object stats.
     *
     * @public
     * @async
     * @param {string} key
     * @returns {Promise<{ exists: false } | { exists: true; stats: FSStats }>}
     */
    getObject(key: string): Promise<{
        exists: false;
    } | {
        exists: true;
        stats: FSStats;
    }>;
    /**
     * Start the server.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stop the server.
     *
     * @public
     * @async
     * @param {boolean} [terminate=false]
     * @returns {Promise<void>}
     */
    stop(terminate?: boolean): Promise<void>;
}
export declare class S3ServerCluster {
    private user;
    private serverConfig;
    private rateLimit;
    private threads;
    private workers;
    private stopSpawning;
    private enableHTTPS;
    private sdk;
    constructor({ hostname, port, user, https, rateLimit, threads }: {
        hostname?: string;
        port?: number;
        https?: boolean;
        user: User;
        rateLimit?: RateLimit;
        threads?: number;
    });
    /**
     * Spawn a worker.
     *
     * @private
     */
    private spawnWorker;
    /**
     * Fork all needed threads.
     *
     * @private
     * @async
     * @returns {Promise<"master" | "worker">}
     */
    private startCluster;
    /**
     * Start the S3 cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stop the S3 cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
}
export default S3Server;
