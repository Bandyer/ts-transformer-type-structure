export function keys<T extends object>(): Array<keyof T>;

export function funs<T extends object>(): Array<Fun>;

export interface Fun {
  name: string;
  args: Val[];
  returnType?: Type;
  isOptional: boolean;
}

export interface Val {
  name: string,
  type: Type
}

export interface Type {
  name: string;
  kind: number;
}
