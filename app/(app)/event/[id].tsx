import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getEvent } from '@/lib/services/events';
import type { Event } from '@/lib/services/events';

export default function EventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const data = await getEvent(id as string);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  if (loading || !event) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <Image source={{ uri: event.image }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{event.title}</Text>
        </View>

        <View style={styles.tags}>
          {event.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Calendar size={20} color="#666" />
            <Text style={styles.infoText}>{new Date(event.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={20} color="#666" />
            <Text style={styles.infoText}>{event.location.address}</Text>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        {event.ticketLink && typeof event.ticketLink === 'string' && (
          <TouchableOpacity 
            style={[styles.button, styles.buttonOutline]} 
            onPress={() => Linking.openURL(event.ticketLink!)}>
            <Text style={styles.buttonOutlineText}>Get Tickets</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add to Plan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 100,
    justifyContent: 'flex-end',
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
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
  infoSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  button: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
  },
  buttonOutlineText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});