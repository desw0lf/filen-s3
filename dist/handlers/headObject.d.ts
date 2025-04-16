import { type Request, type Response, type NextFunction } from "express";
import type Server from "../";
export declare class HeadObject {
    private readonly server;
    constructor(server: Server);
    handle(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default HeadObject;
