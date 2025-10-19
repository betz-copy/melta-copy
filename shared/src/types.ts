export type HexColor = `#${string}`;

export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type FunctionKey<T extends Object, F = Function> = { [K in keyof T]: T[K] extends F ? K : never }[keyof T];

export type RecursiveNullable<T> = { [P in keyof T]: RecursiveNullable<T[P]> | null };

// eslint-disable-next-line no-undef
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export default interface fileDetails {
    file: Partial<File>;
    name: string;
}

export enum SplitBy {
    space = ' ',
    comma = ',',
}
