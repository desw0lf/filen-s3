import { type Request, type Response, type NextFunction } from "express";
import type Server from "../";
export type AuthDetails = {
    accessKeyId: string;
    signature: string;
    signedHeaders: string;
    canonicalRequest: string;
};
export declare class Auth {
    private readonly server;
    constructor(server: Server);
    handle(req: Request, res: Response, next: NextFunction): void;
}
export default Auth;
