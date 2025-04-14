import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, MapPin } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getRestaurant } from '@/lib/services/restaurants';
import { savePlan } from '@/lib/services/plans';
import { auth } from '@/lib/firebase';
import type { Restaurant } from '@/lib/services/restaurants';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const data = await getRestaurant(id as string);
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [id]);

  if (loading || !restaurant) {
    return (
      <View style={styles.container}>
        <Text>Loading restaurant details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal pagingEnabled style={styles.imageCarousel}>
        {restaurant.images.map((image, index) => (
          <Image key={index} source={{ uri: image }} style={styles.image} />
        ))}
      </ScrollView>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating}</Text>
          </View>
          <View style={styles.tags}>
            {restaurant.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MapPin size={20} color="#666" />
            <Text style={styles.infoText}>{restaurant.location.address}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {Object.entries(restaurant.menu).map(([category, items]) => (
            <View key={category} style={styles.menuCategory}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.menuItem}>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                    <Text style={styles.menuItemPrice}>${item.price}</Text>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={async () => {
          if (!auth.currentUser) {
            Alert.alert(
              'Sign In Required',
              'Please sign in to add restaurants to your plan.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign In', 
                  onPress: () => router.push('/(auth)/login')
                }
              ]
            );
            return;
          }

          try {
            await savePlan(auth.currentUser.uid, {
              restaurant: restaurant
            });
            
            Alert.alert(
              'Added to Plan!',
              'Restaurant has been added to your plan. View it in your plans.',
              [
                { 
                  text: 'View Plans',
                  onPress: () => router.push('/plan')
                },
                { text: 'OK' }
              ]
            );
          } catch (error) {
            console.error('Error saving plan:', error);
            Alert.alert(
              'Error',
              'Failed to add restaurant to plan. Please try again.',
              [{ text: 'OK' }]
            );
          }
        }}>
        <Text style={styles.addButtonText}>Add to Plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 300,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCarousel: {
    flex: 1,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
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
  infoSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  menuSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuCategory: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  menuItem: {
    gap: 4,
  },
  menuItemContent: {
    flexDirection: 'column',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 8,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});