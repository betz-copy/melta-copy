// biome-ignore lint/suspicious/noExplicitAny: it's important!
export interface IErrorResponse<T = any> {
    message?: string;
    metadata?: T;
}
