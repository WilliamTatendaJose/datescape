import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { cache } from '../utils/cache';
import type { Location, PaginatedResponse } from './';

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  priceRange: string;
  cuisine: string;
  images: string[];
  location: Location;
  tags: string[];
  vibes: string[];
  menu: Record<string, MenuItem[]>;
}

export interface MenuItem {
  name: string;
  description: string;
  price: number;
  image?: string;  // Optional image URL for menu items
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const cacheKey = `restaurant:${id}`;
  const cachedData = await cache.get<Restaurant>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const docRef = doc(db, 'restaurants', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const restaurant = { id: docSnap.id, ...docSnap.data() } as Restaurant;
    await cache.set(cacheKey, restaurant);
    return restaurant;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

export async function getRestaurants(options: {
  limit?: number;
  lastDoc?: FirebaseFirestore.DocumentSnapshot;
  cuisine?: string;
  priceRange?: string;
  tags?: string[];
  random?: boolean;
  searchText?: string;
} = {}): Promise<PaginatedResponse<Restaurant>> {
  const cacheKey = `restaurants:${JSON.stringify(options)}`;
  const cachedData = await cache.get<PaginatedResponse<Restaurant>>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const restaurantsCol = collection(db, 'restaurants');
    let q = query(restaurantsCol);

    if (options.cuisine) {
      q = query(q, where('cuisine', '==', options.cuisine));
    }

    if (options.priceRange) {
      q = query(q, where('priceRange', '==', options.priceRange));
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
    const restaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[];

    if (options.random) {
      // Shuffle the array if random is true
      for (let i = restaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restaurants[i], restaurants[j]] = [restaurants[j], restaurants[i]];
      }
      // Limit the results after shuffling
      restaurants.splice(options.limit || 10);
    }

    const response: PaginatedResponse<Restaurant> = {
      items: restaurants,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: restaurants.length === (options.limit || 10)
    };

    await cache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return { items: [], hasMore: false };
  }
}