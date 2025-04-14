import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/services/users';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [newVibe, setNewVibe] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!auth.currentUser) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      setDisplayName(userProfile.displayName);
      setLocation(userProfile.location || '');
      setInterests(userProfile.interests);
      setVibes(userProfile.vibes);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile settings');
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !profile) return;

    try {
      await updateUserProfile(auth.currentUser.uid, {
        ...profile,
        displayName,
        location,
        interests,
        vibes
      });
      Alert.alert('Success', 'Profile settings updated successfully');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile settings');
    }
  };

  const addInterest = () => {
    if (newInterest && !interests.includes(newInterest)) {
      setInterests([...interests, newInterest]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const addVibe = () => {
    if (newVibe && !vibes.includes(newVibe)) {
      setVibes([...vibes, newVibe]);
      setNewVibe('');
    }
  };

  const removeVibe = (vibe: string) => {
    setVibes(vibes.filter(v => v !== vibe));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tags}>
            {interests.map((interest, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => removeInterest(interest)}>
                <Text style={styles.tagText}>{interest}</Text>
                <Text style={styles.removeTag}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder="Add new interest"
              onSubmitEditing={addInterest}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addInterest}>
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vibes</Text>
          <View style={styles.tags}>
            {vibes.map((vibe, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => removeVibe(vibe)}>
                <Text style={styles.tagText}>{vibe}</Text>
                <Text style={styles.removeTag}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              value={newVibe}
              onChangeText={setNewVibe}
              placeholder="Add new vibe"
              onSubmitEditing={addVibe}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addVibe}>
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  removeTag: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  addTagContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});