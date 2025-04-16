import { type Request, type Response } from "express";
import type Server from "../";
export declare class HeadBucket {
    private readonly server;
    constructor(server: Server);
    handle(req: Request, res: Response): Promise<void>;
}
export default HeadBucket;
