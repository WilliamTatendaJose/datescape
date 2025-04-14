import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { cache } from '../utils/cache';
import type { Location, PaginatedResponse } from './';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  price: number;
  image: string;
  location: Location;
  category: string;
  tags: string[];
}

export async function getEvent(id: string): Promise<Event | null> {
  const cacheKey = `event:${id}`;
  const cachedData = await cache.get<Event>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const event = { id: docSnap.id, ...docSnap.data() } as Event;
    await cache.set(cacheKey, event);
    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export async function getEvents(options: {
  limit?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  category?: string;
  tags?: string[];
  random?: boolean;
  futureOnly?: boolean;
  searchText?: string;
} = {}): Promise<PaginatedResponse<Event>> {
  const cacheKey = `events:${JSON.stringify(options)}`;
  const cachedData = await cache.get<PaginatedResponse<Event>>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const eventsCol = collection(db, 'events');
    let q = query(eventsCol);

    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options.tags && options.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', options.tags));
    }

    if (options.futureOnly) {
      const today = new Date().toISOString().split('T')[0];
      q = query(q, where('date', '>=', today));
    }

    if (options.searchText) {
      q = query(q, where('searchableText', '>=', options.searchText.toLowerCase()));
      q = query(q, where('searchableText', '<=', options.searchText.toLowerCase() + '\uf8ff'));
    }

    if (!options.random) {
      q = query(q, orderBy('date', 'asc'));
    }

    if (options.lastDoc) {
      q = query(q, orderBy('__name__'), limit(options.limit || 10));
    }

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];

    if (options.random) {
      for (let i = events.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [events[i], events[j]] = [events[j], events[i]];
      }
      events.splice(options.limit || 10);
    }

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] 
      ? (snapshot.docs[snapshot.docs.length - 1] as QueryDocumentSnapshot<DocumentData>)
      : undefined;
    const response: PaginatedResponse<Event> = {
      items: events,
      lastDoc: lastVisibleDoc,
      hasMore: events.length === (options.limit || 10)
    };

    await cache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('Error fetching events:', error);
    return { items: [], hasMore: false };
  }
}