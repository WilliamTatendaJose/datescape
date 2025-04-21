import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signUp(email: string, password: string, userData: { name: string; interests: string[]; vibes: string[] }) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user preferences to Firestore
    const userDoc = doc(db, 'users', user.uid);
    await setDoc(userDoc, {
      name: userData.name,
      email,
      interests: userData.interests,
      vibes: userData.vibes,
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export function useAuth() {
  const auth = getAuth();
  return auth;
}