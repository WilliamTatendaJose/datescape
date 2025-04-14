import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export * from './events';
export * from './lodges';
export * from './plans';
export * from './restaurants';
export * from './users';
export * from './storage';

// Common types for location-based items
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

// Common response type for paginated results
export interface PaginatedResponse<T> {
  items: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
}

// Common error types
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_INPUT: 'INVALID_INPUT',
  UNKNOWN: 'UNKNOWN',
} as const;