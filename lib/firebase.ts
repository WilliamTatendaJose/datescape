import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager,
  doc,
  setDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const envPrefix = isNode ? '' : 'EXPO_PUBLIC_';

const firebaseConfig = {
  apiKey: process.env[`${envPrefix}FIREBASE_API_KEY`],
  authDomain: process.env[`${envPrefix}FIREBASE_AUTH_DOMAIN`],
  projectId: process.env[`${envPrefix}FIREBASE_PROJECT_ID`],
  storageBucket: process.env[`${envPrefix}FIREBASE_STORAGE_BUCKET`],
  messagingSenderId: process.env[`${envPrefix}FIREBASE_MESSAGING_SENDER_ID`],
  appId: process.env[`${envPrefix}FIREBASE_APP_ID`]
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({
      forceOwnership: true
    })
  })
});

// Get Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export the app instance
export default app;

export async function createSampleUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const sampleUserData = {
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
      location: 'New York, NY',
      plansCreated: 15,
      placesVisited: 32,
      photosShared: 84,
      email: 'john.doe@example.com',
      joinedDate: new Date().toISOString(),
      savedPlaces: [
        {
          id: 'place1',
          name: 'Central Park',
          type: 'Park',
          imageUrl: 'https://example.com/central-park.jpg'
        },
        {
          id: 'place2',
          name: 'The Plaza Hotel',
          type: 'Hotel',
          imageUrl: 'https://example.com/plaza-hotel.jpg'
        },
        {
          id: 'place3',
          name: 'Le Bernardin',
          type: 'Restaurant',
          imageUrl: 'https://example.com/le-bernardin.jpg'
        }
      ],
      recentActivity: [
        {
          type: 'PLAN_CREATED',
          text: 'Created a new weekend getaway plan',
          time: '2 hours ago',
          timestamp: new Date().toISOString()
        },
        {
          type: 'PLACE_VISITED',
          text: 'Visited Central Park',
          time: '1 day ago',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          type: 'PHOTO_SHARED',
          text: 'Shared 3 photos from The Plaza Hotel',
          time: '3 days ago',
          timestamp: new Date(Date.now() - 259200000).toISOString()
        }
      ],
      preferences: {
        notifications: true,
        emailUpdates: true,
        privateProfile: false,
        theme: 'light'
      }
    };

    await setDoc(doc(db, 'users', userId), sampleUserData);
    console.log('Sample user document created successfully');
    return sampleUserData;
  } catch (error) {
    console.error('Error creating sample user:', error);
    throw error;
  }
}