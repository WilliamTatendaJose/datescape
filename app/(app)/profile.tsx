import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Settings, Heart, Calendar, MapPin, Camera, Upload } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { logOut } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/services/users';
import { getLikedItems } from '@/lib/services/users';
import { getRestaurants } from '@/lib/services/restaurants';
import { getEvents } from '@/lib/services/events';
import { getLodges } from '@/lib/services/lodges';
import { uploadImage } from '@/lib/services/storage';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

export default function ProfileScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Array<{
    id: string;
    name: string;
    image: string;
    type: 'Restaurant' | 'Event' | 'Lodge';
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      if (!auth.currentUser) {
        router.replace('/(auth)/login');
        return;
      }

      const profile = await getUserProfile(auth.currentUser.uid);
      setUserProfile(profile);

      // Load liked items
      const [likedRestaurants, likedEvents, likedLodges] = await Promise.all([
        getLikedItems(auth.currentUser.uid, 'restaurants'),
        getLikedItems(auth.currentUser.uid, 'events'),
        getLikedItems(auth.currentUser.uid, 'lodges')
      ]);

      // Fetch details for liked items
      const [restaurants, events, lodges] = await Promise.all([
        getRestaurants({ limit: 5 }),
        getEvents({ limit: 5 }),
        getLodges({ limit: 5 })
      ]);

      const savedPlacesData = [
        ...restaurants.items
          .filter(r => likedRestaurants.includes(r.id))
          .map(r => ({
            id: r.id,
            name: r.name,
            image: r.images[0],
            type: 'Restaurant' as const
          })),
        ...events.items
          .filter(e => likedEvents.includes(e.id))
          .map(e => ({
            id: e.id,
            name: e.title,
            image: e.image,
            type: 'Event' as const
          })),
        ...lodges.items
          .filter(l => likedLodges.includes(l.id))
          .map(l => ({
            id: l.id,
            name: l.name,
            image: l.images[0],
            type: 'Lodge' as const
          }))
      ];

      setSavedPlaces(savedPlacesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleUpdateAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setLoading(true);

        try {
          const imageUrl = await uploadImage(uri, `profiles/${auth.currentUser?.uid}`);
          await updateUserProfile(auth.currentUser?.uid as string, {
            ...userProfile,
            avatarUrl: imageUrl
          });
          await loadUserProfile();
          Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to update profile picture');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  if (loading || !userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Plans</Text>
        </View>
        <LoadingIndicator text="Loading profile..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleUpdateAvatar} style={styles.avatarContainer}>
            {userProfile.avatarUrl ? (
              <Image
                source={{ uri: userProfile.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Upload size={24} color="#666" />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Upload size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{userProfile.displayName}</Text>
            {userProfile.location && (
              <Text style={styles.location}>
                <MapPin size={14} color="#666" /> {userProfile.location}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}>
          <Settings size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Places</Text>
            <Heart size={20} color="#666" />
          </View>
          {savedPlaces.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedPlaces}>
              {savedPlaces.map((place) => (
                <TouchableOpacity 
                  key={place.id}
                  style={styles.savedPlace}
                  onPress={() => {
                    switch (place.type) {
                      case 'Restaurant':
                        router.push(`/restaurant/${place.id}`);
                        break;
                      case 'Event':
                        router.push(`/event/${place.id}`);
                        break;
                      case 'Lodge':
                        router.push(`/lodge/${place.id}`);
                        break;
                    }
                  }}>
                  <Image
                    source={{ uri: place.image }}
                    style={styles.savedPlaceImage}
                  />
                  <Text style={styles.savedPlaceTitle}>{place.name}</Text>
                  <Text style={styles.savedPlaceType}>{place.type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No saved places yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Interests</Text>
          </View>
          <View style={styles.tags}>
            {userProfile.interests.map((interest, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Vibes</Text>
          </View>
          <View style={styles.tags}>
            {userProfile.vibes.map((vibe, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{vibe}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderAvatar: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  savedPlaces: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  savedPlace: {
    width: 160,
    marginRight: 16,
  },
  savedPlaceImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  savedPlaceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  savedPlaceType: {
    fontSize: 14,
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
  logoutButton: {
    margin: 24,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});