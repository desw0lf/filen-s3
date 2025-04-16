/// <reference types="node" />
/**
 * Certs
 *
 * @export
 * @class Certs
 * @typedef {Certs}
 */
export declare class Certs {
    static dirPath: string;
    static certPath: string;
    static privateKeyPath: string;
    static expiryPath: string;
    /**
     * Get or generate the self signed SSL certificate.
     *
     * @public
     * @static
     * @async
     * @returns {Promise<{ cert: Buffer; privateKey: Buffer }>}
     */
    static get(): Promise<{
        cert: Buffer;
        privateKey: Buffer;
    }>;
}
export default Certs;
