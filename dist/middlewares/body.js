"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function body(req, _, next) {
    const decodedChunks = [];
    const rawChunks = [];
    req.rawBody = Buffer.from([]);
    req.decodedBody = Buffer.from([]);
    req.bodySize = 0;
    req.on("data", (chunk) => {
        rawChunks.push(chunk);
        if (req.headers["x-amz-content-sha256"] === "STREAMING-AWS4-HMAC-SHA256-PAYLOAD") {
            const chunkStr = chunk.toString("binary");
            const segments = chunkStr.split("\r\n").filter(segment => segment.length > 0);
            for (const segment of segments) {
                if (segment.includes(";chunk-signature=")) {
                    continue;
                }
                const segmentBuffer = Buffer.from(segment, "binary");
                decodedChunks.push(segmentBuffer);
            }
        }
    });
    req.on("end", () => {
        req.rawBody = Buffer.concat(rawChunks);
        req.decodedBody = decodedChunks.length === 0 ? req.rawBody : Buffer.concat(decodedChunks);
        req.bodySize = req.decodedBody.byteLength;
        next();
    });
    req.on("error", err => {
        next(err);
    });
}
exports.default = body;
//# sourceMappingURL=body.js.map