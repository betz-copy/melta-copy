export class ServiceError extends Error {
    constructor(
        public code: number,
        message: string,
        public metadata: object = {},
    ) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}
