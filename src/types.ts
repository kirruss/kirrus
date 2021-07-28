export type Brand<T, B> = T & { _brand: B; _type: T }

export type Cast<T, U> = T extends U ? T : U

export const as = <U, T = any>(x: T): U => x as unknown as U
