export declare function filenLogsPath(): Promise<string>;
export declare class Logger {
    private logger;
    private dest;
    private isCleaning;
    private readonly disableLogging;
    private readonly isWorker;
    constructor(disableLogging?: boolean, isWorker?: boolean);
    init(): Promise<void>;
    waitForPino(): Promise<void>;
    log(level: "info" | "debug" | "warn" | "error" | "trace" | "fatal", object?: unknown, where?: string): void;
}
export default Logger;
