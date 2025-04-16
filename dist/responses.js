"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Responses = void 0;
const xml2js_1 = require("xml2js");
const crypto_1 = __importDefault(require("crypto"));
class Responses {
    static async listBuckets(res, buckets, owner) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            ListAllMyBucketsResult: {
                $: { xmlns: "http://s3.amazonaws.com/doc/2006-03-01/" },
                Buckets: {
                    Bucket: buckets.map(bucket => ({
                        CreationDate: new Date(bucket.creationDate).toISOString(),
                        Name: bucket.name,
                        BucketRegion: "filen"
                    }))
                },
                Owner: {
                    ID: crypto_1.default.createHash("sha256").update(owner.id).digest("hex"),
                    DisplayName: ""
                }
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.byteLength(response).toString());
        res.set("Date", new Date().toUTCString());
        res.status(200);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async error(res, status, code, message) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            Error: {
                Code: code,
                Message: message
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.byteLength(response).toString());
        res.set("Date", new Date().toUTCString());
        res.status(status);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async listObjectsV2(res, prefix, objects, commonPrefixes, bucket, delimiter) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            ListBucketResult: {
                IsTruncated: false,
                Contents: objects.map(object => ({
                    Key: object.path,
                    LastModified: new Date(object.mtimeMs).toISOString(),
                    Size: object.size.toString(),
                    ETag: `"${object.uuid}"`,
                    StorageClass: "STANDARD",
                    ChecksumAlgorithm: []
                })),
                CommonPrefixes: commonPrefixes.map(prefix => ({
                    Prefix: prefix
                })),
                KeyCount: objects.length.toString(),
                Prefix: prefix,
                Delimeter: delimiter,
                MaxKeys: 1000000,
                Name: bucket
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.byteLength(response).toString());
        res.set("Date", new Date().toUTCString());
        res.status(200);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async copyObject(res, result) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            CopyObjectResult: {
                ETag: result.eTag,
                LastModified: new Date(result.lastModified).toISOString()
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.byteLength(response).toString());
        res.set("E-Tag", `"${result.eTag}"`);
        res.set("Date", new Date().toUTCString());
        res.status(200);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async deleteObjects(res, deleted, errors) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            DeleteResult: {
                Deleted: deleted.map(del => ({
                    Key: del.Key
                })),
                Error: errors.map(error => ({
                    Key: error.Key,
                    Code: error.Code,
                    Message: error.Message
                }))
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.byteLength(response).toString());
        res.set("Date", new Date().toUTCString());
        res.status(200);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async getBucketLocation(res) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            LocationConstraint: {
                LocationConstraint: "filen"
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.byteLength(response).toString());
        res.set("Date", new Date().toUTCString());
        res.status(200);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async ok(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.set("Date", new Date().toUTCString());
        res.status(200);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async noContent(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.set("Date", new Date().toUTCString());
        res.status(204);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async badRequest(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.set("Date", new Date().toUTCString());
        res.status(400);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
}
exports.Responses = Responses;
Responses.xmlBuilder = new xml2js_1.Builder({
    xmldec: {
        version: "1.0",
        encoding: "utf-8"
    }
});
exports.default = Responses;
//# sourceMappingURL=responses.js.map