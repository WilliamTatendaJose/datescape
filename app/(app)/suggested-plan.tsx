import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Edit, Clock, MapPin, Trash2 } from 'lucide-react-native';
import { getPlan, updatePlan, Plan } from '@/lib/services/plans';
import { getRestaurant } from '@/lib/services/restaurants';
import { getEvent } from '@/lib/services/events';
import { getLodge } from '@/lib/services/lodges';
import { auth } from '@/lib/firebase';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import { cache } from '@/lib/utils/cache';

type ItemType = 'restaurant' | 'event' | 'lodge';

interface PlanItem {
  id: string;
  name?: string;
  title?: string;
  image?: string;
  images?: string[];
  location?: {
    address?: string;
  };
  notes?: string;
  type: ItemType;
}

export default function SuggestedPlanScreen() {
  const { planId } = useLocalSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<{
    restaurant: PlanItem | null;
    event: PlanItem | null;
    lodge: PlanItem | null;
  }>({
    restaurant: null,
    event: null,
    lodge: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) {
      router.replace('/plan');
      return;
    }

    const fetchPlanAndItems = async () => {
      try {
        setLoading(true);
        console.log('Fetching plan with ID:', planId.toString());
        
        // Clear cache to ensure fresh data
        await cache.invalidate(`plan:${planId.toString()}`);
        
        const planData = await getPlan(planId.toString());
        if (!planData) {
          alert('Plan not found');
          router.replace('/plan');
          return;
        }

        setPlan(planData);

        // Fetch suggested items based on plan preferences
        const fetchedItems: {
          restaurant: PlanItem | null;
          event: PlanItem | null;
          lodge: PlanItem | null;
        } = {
          restaurant: null,
          event: null,
          lodge: null
        };

        // If the plan already has items in the itinerary, fetch those
        if (planData.itinerary && planData.itinerary.length > 0) {
          console.log('Plan has itinerary items:', planData.itinerary);
          
          // Use Promise.all to fetch all items in parallel for better performance
          const itemPromises = planData.itinerary.map(async (item) => {
            console.log('Processing itinerary item:', item);
            try {
              let itemData = null;
              
              switch (item.type) {
                case 'restaurant':
                  console.log('Fetching restaurant with ID:', item.itemId);
                  itemData = await getRestaurant(item.itemId);
                  if (itemData) {
                    console.log('Restaurant data fetched:', itemData.name);
                    fetchedItems.restaurant = { 
                      ...itemData, 
                      notes: item.notes,
                      type: 'restaurant' as const
                    };
                  } else {
                    console.error('Failed to fetch restaurant with ID:', item.itemId);
                  }
                  break;
                case 'event':
                  console.log('Fetching event with ID:', item.itemId);
                  itemData = await getEvent(item.itemId);
                  if (itemData) {
                    console.log('Event data fetched:', itemData.title);
                    fetchedItems.event = { 
                      ...itemData, 
                      name: itemData.title, // Add name property for consistency
                      notes: item.notes,
                      type: 'event' as const
                    };
                  } else {
                    console.error('Failed to fetch event with ID:', item.itemId);
                  }
                  break;
                case 'lodge':
                  console.log('Fetching lodge with ID:', item.itemId);
                  itemData = await getLodge(item.itemId);
                  if (itemData) {
                    console.log('Lodge data fetched:', itemData.name);
                    fetchedItems.lodge = { 
                      ...itemData, 
                      notes: item.notes,
                      type: 'lodge' as const
                    };
                  } else {
                    console.error('Failed to fetch lodge with ID:', item.itemId);
                  }
                  break;
                default:
                  console.error('Unknown item type:', item.type);
              }
              
              return itemData;
            } catch (error) {
              console.error(`Error fetching item of type ${item.type}:`, error);
              return null;
            }
          });
          
          // Wait for all items to be fetched
          await Promise.all(itemPromises);
        } else {
          console.log('Plan has no itinerary items');
        }

        console.log('Setting items:', fetchedItems);
        setItems(fetchedItems);
      } catch (error) {
        console.error('Error fetching plan:', error);
        alert('Failed to load plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndItems();
  }, [planId, router]);

  const handleEdit = (type: ItemType) => {
    router.push({
      pathname: '/choose-item',
      params: { planId: planId?.toString(), type }
    });
  };

  const handleRemove = (type: ItemType) => {
    setItems(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      
      // Create itinerary from selected items
      const itinerary = [];
      if (items.restaurant) {
        itinerary.push({
          type: 'restaurant' as const,
          itemId: items.restaurant.id,
          notes: items.restaurant.notes || `Dinner at ${items.restaurant.name}`
        });
      }
      if (items.event) {
        itinerary.push({
          type: 'event' as const,
          itemId: items.event.id,
          notes: items.event.notes || `Attend ${items.event.title || items.event.name}`
        });
      }
      if (items.lodge) {
        itinerary.push({
          type: 'lodge' as const,
          itemId: items.lodge.id,
          notes: items.lodge.notes || `Stay at ${items.lodge.name}`
        });
      }

      // Update plan with itinerary
      if (planId) {
        await updatePlan(planId.toString(), { itinerary });
        
        // Navigate to review screen
        router.push({
          pathname: '/review-plan',
          params: { planId: planId.toString() }
        });
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator text="Creating your perfect date plan..." color="#E57373" />
        <Text style={styles.loadingText}>Creating your perfect date plan...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Suggested Plan</Text>
        
        {/* Restaurant Card */}
        <View style={styles.card}>
          {items.restaurant ? (
            <>
              <Image 
                source={{ uri: items.restaurant.images?.[0] || 'https://via.placeholder.com/300x150' }} 
                style={styles.cardImage} 
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{items.restaurant.name}</Text>
                <Text style={styles.cardSubtitle}>Italian</Text>
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetail}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.cardDetailText}>7:00 PM</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEdit('restaurant')}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemove('restaurant')}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.emptyCard}
              onPress={() => handleEdit('restaurant')}
            >
              <Text style={styles.emptyCardText}>Add a Restaurant</Text>
              <Text style={styles.emptyCardSubtext}>Find the perfect dining spot</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Event Card */}
        <View style={styles.card}>
          {items.event ? (
            <>
              <Image 
                source={{ uri: items.event.image || 'https://via.placeholder.com/300x150' }} 
                style={styles.cardImage} 
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{items.event.title || items.event.name}</Text>
                <Text style={styles.cardSubtitle}>Cozy, Private</Text>
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetail}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.cardDetailText}>9:00 PM</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEdit('event')}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemove('event')}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.emptyCard}
              onPress={() => handleEdit('event')}
            >
              <Text style={styles.emptyCardText}>Add an Event</Text>
              <Text style={styles.emptyCardSubtext}>Find something fun to do</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Lodge Card */}
        <View style={styles.card}>
          {items.lodge ? (
            <>
              <Image 
                source={{ uri: items.lodge.images?.[0] || 'https://via.placeholder.com/300x150' }} 
                style={styles.cardImage} 
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{items.lodge.name}</Text>
                <Text style={styles.cardSubtitle}>Luxury Lodge</Text>
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetail}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.cardDetailText}>{items.lodge.location?.address || 'Location'}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEdit('lodge')}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemove('lodge')}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.emptyCard}
              onPress={() => handleEdit('lodge')}
            >
              <Text style={styles.emptyCardText}>Add a Lodge</Text>
              <Text style={styles.emptyCardSubtext}>Find a place to stay</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 88 : 68, // Add padding for tab bar
  },
  content: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Extra padding for content
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardDetails: {
    marginBottom: 16,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E57373',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  removeButtonText: {
    color: '#E57373',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E7D32',
  },
  emptyCardSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
