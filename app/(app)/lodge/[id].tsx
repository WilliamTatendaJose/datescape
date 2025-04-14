import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, MapPin, Phone, Mail } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getLodge } from '@/lib/services/lodges';
import type { Lodge } from '@/lib/services/lodges';

export default function LodgeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLodge() {
      try {
        const data = await getLodge(id as string);
        setLodge(data);
      } catch (error) {
        console.error('Error fetching lodge:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLodge();
  }, [id]);

  if (loading || !lodge) {
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

      <ScrollView horizontal pagingEnabled style={styles.imageCarousel}>
        {lodge.images.map((image, index) => (
          <Image key={index} source={{ uri: image }} style={styles.image} />
        ))}
      </ScrollView>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{lodge.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{lodge.rating}</Text>
          </View>
        </View>

        <View style={styles.tags}>
          {lodge.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MapPin size={20} color="#666" />
            <Text style={styles.infoText}>{lodge.location.address}</Text>
          </View>
          <View style={styles.infoItem}>
            <Phone size={20} color="#666" />
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${lodge.contact.phone}`)}>
              <Text style={styles.infoTextLink}>{lodge.contact.phone}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoItem}>
            <Mail size={20} color="#666" />
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${lodge.contact.email}`)}>
              <Text style={styles.infoTextLink}>{lodge.contact.email}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>{lodge.priceRange}</Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.description}>{lodge.description}</Text>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonOutline]} 
          onPress={() => Linking.openURL(`mailto:${lodge.contact.email}`)}>
          <Text style={styles.buttonOutlineText}>Contact Lodge</Text>
        </TouchableOpacity>
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
  imageCarousel: {
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
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
  infoTextLink: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
  priceSection: {
    marginBottom: 24,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
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