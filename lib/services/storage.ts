import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadImage(uri: string, path: string): Promise<string> {
  try {
    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a storage reference
    const storageRef = ref(storage, path);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}