import {
  Query,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
  getDocs,
  query as buildQuery,
  startAfter,
  limit,
} from 'firebase/firestore';

export interface PaginatedResponse<T> {
  items: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
}

export async function getPaginatedResults<T>(
  baseQuery: Query<DocumentData>,
  pageSize: number = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResponse<T>> {
  try {
    let paginatedQuery = baseQuery;

    // Apply pagination constraints properly
    if (lastDoc) {
      paginatedQuery = buildQuery(baseQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      paginatedQuery = buildQuery(baseQuery, limit(pageSize));
    }

    // Execute query
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(paginatedQuery);

    const docs = snapshot.docs;

    const items = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const lastVisible = docs.length > 0 ? docs[docs.length - 1] : undefined;

    return {
      items,
      lastDoc: lastVisible,
      hasMore: docs.length === pageSize,
    };
  } catch (error) {
    console.error('Error getting paginated results:', error);
    throw error;
  }
}

export function createPaginationKey(
  collection: string,
  filters?: Record<string, any>
): string {
  return `${collection}:${JSON.stringify(filters || {})}`;
}
