export interface IErrorResponse<T = any> {
    message?: string;
    metadata?: T;
}
