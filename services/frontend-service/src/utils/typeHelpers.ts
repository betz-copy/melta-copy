export type PartialRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

type OmitNever<T extends Record<string, unknown>> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };
export type SharedProperties<A, B> = OmitNever<Pick<A & B, keyof A & keyof B>>;
