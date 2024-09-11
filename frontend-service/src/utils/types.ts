export type HexColor = `#${string}`;

export type RecursiveNullable<T> = { [P in keyof T]: RecursiveNullable<T[P]> | null };
