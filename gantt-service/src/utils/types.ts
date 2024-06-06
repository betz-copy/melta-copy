export type FunctionKey<T extends Object, F = Function> = { [K in keyof T]: T[K] extends F ? K : never }[keyof T];
