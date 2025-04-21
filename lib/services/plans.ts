import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cache } from '../utils/cache';
import type { PaginatedResponse } from './';

export interface Plan {
  id: string;
  userId: string;
  title: string;
  date: string;
  time?: string;
  notes?: string;
  vibe?: string;
  budget?: string;
  itinerary: Array<{
    type: 'event' | 'restaurant' | 'lodge';
    itemId: string;
    notes?: string;
  }>;
}

export interface InspiredPlan {
  restaurant?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    title: string;
  };
  lodge?: {
    id: string;
    name: string;
  };
}

export async function getPlan(id: string): Promise<Plan | null> {
  const cacheKey = `plan:${id}`;
  const cachedData = await cache.get<Plan>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const docRef = doc(db, 'plans', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const plan = { id: docSnap.id, ...docSnap.data() } as Plan;
    await cache.set(cacheKey, plan);
    return plan;
  } catch (error) {
    console.error('Error fetching plan:', error);
    return null;
  }
}

export async function getPlans(options: {
  userId: string;
  limit?: number;
  lastDoc?: FirebaseFirestore.DocumentSnapshot;
} = { userId: '' }): Promise<PaginatedResponse<Plan>> {
  const cacheKey = `plans:${JSON.stringify(options)}`;
  const cachedData = await cache.get<PaginatedResponse<Plan>>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const plansCol = collection(db, 'plans');
    let q = query(plansCol, where('userId', '==', options.userId));

    q = query(q, orderBy('date', 'desc'));

    if (options.lastDoc) {
      q = query(q, orderBy('__name__'), limit(options.limit || 10));
    }

    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Plan[];

    const response: PaginatedResponse<Plan> = {
      items: plans,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: plans.length === (options.limit || 10)
    };

    await cache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('Error fetching plans:', error);
    return { items: [], hasMore: false };
  }
}

export async function createPlan(plan: Omit<Plan, 'id'>): Promise<Plan | null> {
  try {
    const plansCol = collection(db, 'plans');
    const docRef = await addDoc(plansCol, plan);
    const newPlan = { id: docRef.id, ...plan };
    
    // Invalidate the plans cache for this user
    await cache.invalidate(`plans:{"userId":"${plan.userId}"}`);
    
    return newPlan;
  } catch (error) {
    console.error('Error creating plan:', error);
    return null;
  }
}

export async function updatePlan(id: string, updates: Partial<Plan>): Promise<boolean> {
  try {
    const docRef = doc(db, 'plans', id);
    await updateDoc(docRef, updates);
    
    // Invalidate both the specific plan and the plans list caches
    await cache.invalidate(`plan:${id}`);
    if (updates.userId) {
      await cache.invalidate(`plans:{"userId":"${updates.userId}"}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating plan:', error);
    return false;
  }
}

export async function deletePlan(id: string, userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'plans', id);
    await deleteDoc(docRef);
    
    // Invalidate both the specific plan and the plans list caches
    await cache.invalidate(`plan:${id}`);
    await cache.invalidate(`plans:{"userId":"${userId}"}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting plan:', error);
    return false;
  }
}

export async function savePlan(userId: string, plan: InspiredPlan): Promise<Plan | null> {
  const dateStr = new Date().toISOString().split('T')[0];
  
  const newPlan: Omit<Plan, 'id'> = {
    userId,
    title: 'Inspired Date Plan',
    date: dateStr,
    itinerary: [
      ...(plan.restaurant ? [{
        type: 'restaurant' as const,
        itemId: plan.restaurant.id,
        notes: `Dinner at ${plan.restaurant.name}`
      }] : []),
      ...(plan.event ? [{
        type: 'event' as const,
        itemId: plan.event.id,
        notes: `Attend ${plan.event.title}`
      }] : []),
      ...(plan.lodge ? [{
        type: 'lodge' as const,
        itemId: plan.lodge.id,
        notes: `Stay at ${plan.lodge.name}`
      }] : [])
    ]
  };

  return createPlan(newPlan);
}
