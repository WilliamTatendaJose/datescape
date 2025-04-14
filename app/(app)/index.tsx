import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getRestaurants } from '@/lib/services/restaurants';
import { getEvents } from '@/lib/services/events';
import { getLodges } from '@/lib/services/lodges';
import { savePlan } from '@/lib/services/plans';
import { auth } from '@/lib/firebase';
import type { Restaurant } from '@/lib/services/restaurants';
import type { Event } from '@/lib/services/events';
import type { Lodge } from '@/lib/services/lodges';
import { Sparkles } from 'lucide-react-native';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

export default function HomeScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspirePlan, setInspirePlan] = useState<{
    restaurant: Restaurant | null;
    event: Event | null;
    lodge: Lodge | null;
  } | null>(null);
  const [inspireLoading, setInspireLoading] = useState(false);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const [restaurantData, eventData, lodgeData] = await Promise.all([
          getRestaurants({ limit: 5 }),
          getEvents({ limit: 5 }),
          getLodges({ limit: 5 })
        ]);

        setRestaurants(restaurantData.items || []);
        setEvents(eventData.items || []);
        setLodges(lodgeData.items || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  const generateInspiration = async () => {
    setInspireLoading(true);
    try {
      const [restaurantData, eventData, lodgeData] = await Promise.all([
        getRestaurants({ limit: 1, random: true }),
        getEvents({ limit: 1, random: true }),
        getLodges({ limit: 1, random: true })
      ]);

      const restaurant = restaurantData.items[0];
      const event = eventData.items[0];
      const lodge = lodgeData.items[0];

      setInspirePlan({
        restaurant: restaurant || null,
        event: event || null,
        lodge: lodge || null
      });
    } catch (error) {
      console.error('Error generating inspiration:', error);
    } finally {
      setInspireLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Evening!</Text>
          <TouchableOpacity 
            style={styles.inspireButton} 
            onPress={generateInspiration}
            disabled={inspireLoading}>
            <Sparkles size={16} color="#fff" />
            <Text style={styles.inspireText}>Inspire Me</Text>
          </TouchableOpacity>
        </View>
        <LoadingIndicator text="Loading recommendations..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Evening!</Text>
        <TouchableOpacity 
          style={styles.inspireButton} 
          onPress={generateInspiration}
          disabled={inspireLoading}>
          <Sparkles size={16} color="#fff" />
          <Text style={styles.inspireText}>Inspire Me</Text>
        </TouchableOpacity>
      </View>

      {inspireLoading ? (
        <View style={[styles.inspirePlan, styles.inspirePlanLoading]}>
          <LoadingIndicator text="Crafting your perfect date plan..." />
        </View>
      ) : inspirePlan && (
        <View style={styles.inspirePlan}>
          <Text style={styles.inspireTitle}>Here's a Perfect Date Plan!</Text>
          <View style={styles.inspireCards}>
            {inspirePlan.restaurant && (
              <TouchableOpacity
                style={styles.inspireCard}
                onPress={() => router.push(`/restaurant/${inspirePlan.restaurant!.id}`)}>
                <Image source={{ uri: inspirePlan.restaurant.images[0] }} style={styles.inspireImage} />
                <View style={styles.inspireCardContent}>
                  <Text style={styles.inspireCardTitle}>{inspirePlan.restaurant.name}</Text>
                  <Text style={styles.inspireCardSubtitle}>Dinner</Text>
                </View>
              </TouchableOpacity>
            )}
            {inspirePlan.event && (
              <TouchableOpacity
                style={styles.inspireCard}
                onPress={() => router.push(`/event/${inspirePlan.event!.id}`)}>
                <Image source={{ uri: inspirePlan.event.image }} style={styles.inspireImage} />
                <View style={styles.inspireCardContent}>
                  <Text style={styles.inspireCardTitle}>{inspirePlan.event.title}</Text>
                  <Text style={styles.inspireCardSubtitle}>Activity</Text>
                </View>
              </TouchableOpacity>
            )}
            {inspirePlan.lodge && (
              <TouchableOpacity
                style={styles.inspireCard}
                onPress={() => router.push(`/lodge/${inspirePlan.lodge!.id}`)}>
                <Image source={{ uri: inspirePlan.lodge.images[0] }} style={styles.inspireImage} />
                <View style={styles.inspireCardContent}>
                  <Text style={styles.inspireCardTitle}>{inspirePlan.lodge.name}</Text>
                  <Text style={styles.inspireCardSubtitle}>Stay</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.savePlanButton}
            onPress={async () => {
              if (!auth.currentUser) {
                Alert.alert(
                  'Sign In Required',
                  'Please sign in to save your date plans.',
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

              if (!inspirePlan) return;

              try {
                await savePlan(auth.currentUser.uid, {
                  restaurant: inspirePlan.restaurant || undefined,
                  event: inspirePlan.event || undefined,
                  lodge: inspirePlan.lodge || undefined
                });
                
                Alert.alert(
                  'Plan Saved!',
                  'Your date plan has been saved. View it in your profile.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Error saving plan:', error);
                Alert.alert(
                  'Error',
                  'Failed to save your plan. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            }}>
            <Text style={styles.savePlanText}>Save This Plan</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Restaurants</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.card}
                onPress={() => router.push(`/restaurant/${restaurant.id}`)}>
                <Image source={{ uri: restaurant.images[0] }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{restaurant.name}</Text>
                  <Text style={styles.cardSubtitle}>⭐ {restaurant.rating} • {restaurant.tags[0]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                onPress={() => router.push(`/event/${event.id}`)}>
                <Image source={{ uri: event.image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardSubtitle}>📅 {new Date(event.date).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Lodges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lodges.map((lodge) => (
              <TouchableOpacity
                key={lodge.id}
                style={styles.card}
                onPress={() => router.push(`/lodge/${lodge.id}`)}>
                <Image source={{ uri: lodge.images[0] }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{lodge.name}</Text>
                  <Text style={styles.cardSubtitle}>⭐ {lodge.rating} • {lodge.tags[0]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  inspireButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspireText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    height: 160,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  inspirePlan: {
    backgroundColor: '#f5f5f5',
    margin: 24,
    padding: 16,
    borderRadius: 16,
  },
  inspireTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inspireCards: {
    gap: 12,
  },
  inspireCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inspireImage: {
    width: 80,
    height: 80,
  },
  inspireCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  inspireCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  inspireCardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  savePlanButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  savePlanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inspirePlanLoading: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});