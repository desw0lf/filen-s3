import { type Request, type Response } from "express";
import type Server from "..";
import { type FSStats } from "@filen/sdk";
export type FSStatsObject = FSStats & {
    path: string;
};
export declare class ListObjectsV2 {
    private readonly server;
    constructor(server: Server);
    private parseQueryParams;
    /**
     * Normalize the prefix so we can properly use it in the SDK.
     *
     * @private
     * @param {string} prefix
     * @returns {string}
     */
    private normalizePrefix;
    /**
     * Read a cloud directory (recursively to a maximum depth).
     *
     * @private
     * @async
     * @param {string} path
     * @param {number} depth
     * @returns {Promise<string[]>}
     */
    private readdir;
    handle(req: Request, res: Response): Promise<void>;
}
export default ListObjectsV2;
