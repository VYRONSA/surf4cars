/**
 * Shared application types.
 * Domain-specific types belong in their respective feature modules.
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface BaseEntity {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
}
