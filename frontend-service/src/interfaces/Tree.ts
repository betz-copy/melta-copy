export type TreeType<T> = T &
    Partial<T> & {
        children: T[];
    };
