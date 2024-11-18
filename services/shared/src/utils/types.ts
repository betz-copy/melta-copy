export type HexColor = `#${string}`;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type FunctionKey<T extends Object, F = Function> = {
  [K in keyof T]: T[K] extends F ? K : never;
}[keyof T];

export type RecursiveNullable<T> = {
  [P in keyof T]: RecursiveNullable<T[P]> | null;
};
