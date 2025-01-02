export type TreeType<T, K = T> = (T | K) &
    Partial<T> & {
        children?: TreeType<T, K>[];
    };
