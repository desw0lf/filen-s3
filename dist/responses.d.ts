import { type Response } from "express";
import { Builder } from "xml2js";
import { type FSStatsObject } from "./handlers/listObjects";
export declare class Responses {
    static readonly xmlBuilder: Builder;
    static listBuckets(res: Response, buckets: {
        name: string;
        creationDate: number;
    }[], owner: {
        id: string;
        displayName: string;
    }): Promise<void>;
    static error(res: Response, status: number, code: string, message: string): Promise<void>;
    static listObjectsV2(res: Response, prefix: string, objects: FSStatsObject[], commonPrefixes: string[], bucket: string, delimiter: string): Promise<void>;
    static copyObject(res: Response, result: {
        eTag: string;
        lastModified: number;
    }): Promise<void>;
    static deleteObjects(res: Response, deleted: {
        Key: string;
    }[], errors: {
        Key: string;
        Code: string;
        Message: string;
    }[]): Promise<void>;
    static getBucketLocation(res: Response): Promise<void>;
    static ok(res: Response): Promise<void>;
    static noContent(res: Response): Promise<void>;
    static badRequest(res: Response): Promise<void>;
}
export default Responses;
