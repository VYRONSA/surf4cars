/**
 * Application-level state management.
 * Store implementations will be added as features are built.
 */

export type StoreStatus = "idle" | "loading" | "success" | "error";

export interface StoreState<T> {
  readonly data: T | null;
  readonly status: StoreStatus;
  readonly error: string | null;
}

export const initialStoreState = {
  data: null,
  status: "idle" as StoreStatus,
  error: null,
} satisfies StoreState<unknown>;
