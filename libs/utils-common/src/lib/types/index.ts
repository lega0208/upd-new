/*
 * Type utilities
 */

/**
 * Returns an interface with only the properties of the given type
 */
export type PickByType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}
