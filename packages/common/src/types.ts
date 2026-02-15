export type HexColor = `#${string}`;

export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

// biome-ignore lint/complexity/noBannedTypes: lol
export type FunctionKey<T extends object, F = Function> = { [K in keyof T]: T[K] extends F ? K : never }[keyof T];

export type RecursiveNullable<T> = { [P in keyof T]: RecursiveNullable<T[P]> | null };

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export interface FileDetails {
    file: Partial<File>;
    name: string;
}

export enum SplitBy {
    space = ' ',
    comma = ',',
}

export enum Conjunction {
    AND = 'AND',
    OR = 'OR',
}

export interface IMongoProps {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export * from './user/types';
