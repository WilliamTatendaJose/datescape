import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  location?: string;
  interests: string[];
  vibes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createUserProfile(id: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', id);
  const now = new Date();
  
  const profile: UserProfile = {
    id,
    displayName: data.displayName || '',
    email: data.email || '',
    avatarUrl: data.avatarUrl,
    location: data.location,
    interests: data.interests || [],
    vibes: data.vibes || [],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, profile);
}

export async function getUserProfile(id: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', id);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User profile not found');
  }

  return userSnap.data() as UserProfile;
}

export async function updateUserProfile(id: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', id);
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };
  await updateDoc(userRef, updateData);
}

export async function getLikedItems(userId: string, type: 'restaurants' | 'events' | 'lodges'): Promise<string[]> {
  const likesRef = doc(db, 'users', userId, 'likes', type);
  const likesSnap = await getDoc(likesRef);
  
  if (!likesSnap.exists()) {
    return [];
  }

  return likesSnap.data().items || [];
}

export async function toggleLikedItem(
  userId: string, 
  itemId: string, 
  type: 'restaurants' | 'events' | 'lodges'
): Promise<void> {
  const likesRef = doc(db, 'users', userId, 'likes', type);
  const likesSnap = await getDoc(likesRef);
  
  if (!likesSnap.exists()) {
    await setDoc(likesRef, { items: [itemId] });
    return;
  }

  const items = likesSnap.data().items || [];
  const newItems = items.includes(itemId)
    ? items.filter((id: string) => id !== itemId)
    : [...items, itemId];

  await setDoc(likesRef, { items: newItems });
}