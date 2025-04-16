import { type Request, type Response, type NextFunction } from "express";
import type Server from "../";
export type DeleteObjectsXML = {
    Delete?: {
        Object?: {
            Key: string;
        }[];
    };
};
export declare class DeleteObjects {
    private readonly server;
    constructor(server: Server);
    handle(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default DeleteObjects;
