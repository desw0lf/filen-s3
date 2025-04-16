import { type Request, type Response, type NextFunction } from "express";
import type Server from "../";
export declare class PutObject {
    private readonly server;
    constructor(server: Server);
    copy(req: Request, res: Response): Promise<void>;
    mkdir(req: Request, res: Response): Promise<void>;
    handle(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default PutObject;
