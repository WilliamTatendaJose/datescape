import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { cache } from '../utils/cache';
import type { Location, PaginatedResponse } from './';

export interface Lodge {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  images: string[];
  location: Location;
  amenities: string[];
  roomTypes: RoomType[];
  tags: string[];
}

export interface RoomType {
  name: string;
  description: string;
  pricePerNight: number;
  capacity: number;
}

export async function getLodge(id: string): Promise<Lodge | null> {
  const cacheKey = `lodge:${id}`;
  const cachedData = await cache.get<Lodge>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const docRef = doc(db, 'lodges', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const lodge = { id: docSnap.id, ...docSnap.data() } as Lodge;
    await cache.set(cacheKey, lodge);
    return lodge;
  } catch (error) {
    console.error('Error fetching lodge:', error);
    return null;
  }
}

export async function getLodges(options: {
  limit?: number;
  lastDoc?: FirebaseFirestore.DocumentSnapshot;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  tags?: string[];
  random?: boolean;
  searchText?: string;
} = {}): Promise<PaginatedResponse<Lodge>> {
  const cacheKey = `lodges:${JSON.stringify(options)}`;
  const cachedData = await cache.get<PaginatedResponse<Lodge>>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const lodgesCol = collection(db, 'lodges');
    let q = query(lodgesCol);

    if (options.minPrice !== undefined) {
      q = query(q, where('pricePerNight', '>=', options.minPrice));
    }

    if (options.maxPrice !== undefined) {
      q = query(q, where('pricePerNight', '<=', options.maxPrice));
    }

    if (options.amenities && options.amenities.length > 0) {
      q = query(q, where('amenities', 'array-contains-any', options.amenities));
    }

    if (options.tags && options.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', options.tags));
    }

    if (options.searchText) {
      q = query(q, where('searchableText', '>=', options.searchText.toLowerCase()));
      q = query(q, where('searchableText', '<=', options.searchText.toLowerCase() + '\uf8ff'));
    }

    if (!options.random) {
      q = query(q, orderBy('rating', 'desc'));
    }

    if (options.lastDoc) {
      q = query(q, orderBy('__name__'), limit(options.limit || 10));
    }

    const snapshot = await getDocs(q);
    const lodges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lodge[];

    if (options.random) {
      for (let i = lodges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lodges[i], lodges[j]] = [lodges[j], lodges[i]];
      }
      lodges.splice(options.limit || 10);
    }

    const response: PaginatedResponse<Lodge> = {
      items: lodges,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: lodges.length === (options.limit || 10)
    };

    await cache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('Error fetching lodges:', error);
    return { items: [], hasMore: false };
  }
}