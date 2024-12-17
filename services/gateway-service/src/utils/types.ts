export type HexColor = `#${string}`;

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RecursiveNullable<T> = { [P in keyof T]: RecursiveNullable<T[P]> | null };
