import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Animated, PanResponder, Platform } from 'react-native';
import { Plus, Calendar, Clock, MapPin, Trash2 } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { getPlans, deletePlan, createPlan } from '@/lib/services/plans';
import { auth } from '@/lib/firebase';
import { cache } from '@/lib/utils/cache';
import type { Plan } from '@/lib/services/plans';
import { getRestaurant, Restaurant } from '@/lib/services/restaurants';
import { getEvent, Event } from '@/lib/services/events';
import { getLodge, Lodge } from '@/lib/services/lodges';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

function SwipeableCard({ plan, onDelete, children }: { 
  plan: Plan; 
  onDelete: (id: string) => void;
  children: React.ReactNode;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const deleteThreshold = -75;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) { // Only allow left swipe
          pan.setValue(Math.max(gestureState.dx, deleteThreshold));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < deleteThreshold) {
          // Show delete confirmation
          Alert.alert(
            'Delete Plan',
            'Are you sure you want to delete this plan?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  Animated.spring(pan, {
                    toValue: 0,
                    useNativeDriver: false
                  }).start();
                }
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDelete(plan.id)
              }
            ]
          );
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const deleteButtonOpacity = pan.interpolate({
    inputRange: [deleteThreshold, 0],
    outputRange: [1, 0]
  });

  return (
    <View style={styles.swipeableContainer}>
      <Animated.View 
        style={[styles.deleteButton, { opacity: deleteButtonOpacity }]}>
        <Trash2 size={24} color="#fff" />
      </Animated.View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX: pan }]
          }
        ]}>
        {children}
      </Animated.View>
    </View>
  );
}

export default function PlanScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Record<string, any>>({});

  async function fetchPlans() {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Clear cache to ensure fresh data
      const cacheKey = `plans:{"userId":"${auth.currentUser.uid}"}`;
      await cache.invalidate(cacheKey);
      
      const response = await getPlans({ userId: auth.currentUser.uid });
      setPlans(response.items);

      // Fetch details for all items in all plans
      const itemDetails: Record<string, any> = {};
      
      // Use Promise.all for parallel fetching to improve performance
      const fetchPromises = response.items.flatMap(plan => 
        plan.itinerary.map(async item => {
          if (!itemDetails[item.itemId]) {
            try {
              let details;
              switch (item.type) {
                case 'restaurant':
                  details = await getRestaurant(item.itemId);
                  break;
                case 'event':
                  details = await getEvent(item.itemId);
                  break;
                case 'lodge':
                  details = await getLodge(item.itemId);
                  break;
              }
              if (details) {
                itemDetails[item.itemId] = details;
                // Use type guards to safely access properties
                if ('name' in details) {
                  console.log(`Fetched ${item.type} details:`, details.name);
                } else if ('title' in details) {
                  console.log(`Fetched ${item.type} details:`, details.title);
                }
              } else {
                console.error(`Failed to fetch ${item.type} with ID:`, item.itemId);
              }
            } catch (error) {
              console.error(`Error fetching ${item.type} with ID ${item.itemId}:`, error);
            }
          }
        })
      );
      
      // Wait for all fetch operations to complete
      await Promise.all(fetchPromises.filter(p => p !== undefined));
      
      console.log('All item details fetched:', Object.keys(itemDetails).length);
      setDetails(itemDetails);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDeletePlan = async (planId: string) => {
    if (!auth.currentUser) return;
    
    try {
      await deletePlan(planId, auth.currentUser.uid);
      fetchPlans(); // Refresh plans after deletion
    } catch (error) {
      console.error('Error deleting plan:', error);
      Alert.alert('Error', 'Failed to delete plan. Please try again.');
    }
  };

  const handleCreatePlan = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please sign in to create a plan');
      return;
    }

    // Navigate to the create plan screen instead of creating an empty plan
    router.push('/create-plan');
  };

  const now = new Date();
  const upcomingPlans = plans.filter(plan => {
    const eventItem = plan.itinerary.find(item => item.type === 'event');
    return eventItem && details[eventItem.itemId]?.date && new Date(details[eventItem.itemId].date) >= now;
  });
  const pastPlans = plans.filter(plan => {
    const eventItem = plan.itinerary.find(item => item.type === 'event');
    return !eventItem || !details[eventItem.itemId]?.date || new Date(details[eventItem.itemId].date) < now;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Plans</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreatePlan}>
          <Plus size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Plan</Text>
        </TouchableOpacity>
      </View>

      {!auth.currentUser ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sign in to view plans</Text>
          <Text style={styles.emptyText}>Create and save your perfect date plans</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator text="Loading your plans..." color="#E57373" />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.emptyText}>Start by clicking "Inspire Me" on the home screen</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {upcomingPlans.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcomingPlans.map(plan => (
                <SwipeableCard key={plan.id} plan={plan} onDelete={handleDeletePlan}>
                  <View style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <View style={styles.planDate}>
                        <Calendar size={16} color="#666" />
                        <Text style={styles.planDateText}>
                          {new Date(plan.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.timeline}>
                      {plan.itinerary.map((item, index) => {
                        const itemDetails = details[item.itemId];
                        if (!itemDetails) return null;

                        return (
                          <View key={index} style={styles.timelineItem}>
                            <View style={styles.timelineTime}>
                              <Clock size={16} color="#666" />
                              <Text style={styles.timeText}>
                                {item.type === 'restaurant' ? 'Dinner' :
                                 item.type === 'event' ? 'Activity' : 'Stay'}
                              </Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.timelineContent}
                              onPress={() => router.push(`/${item.type}/${item.itemId}`)}>
                              <Image
                                source={{ uri: itemDetails.images?.[0] || itemDetails.image }}
                                style={styles.timelineImage}
                              />
                              <View style={styles.timelineDetails}>
                                <Text style={styles.timelineTitle}>
                                  {itemDetails.name || itemDetails.title}
                                </Text>
                                <View style={styles.timelineMeta}>
                                  <MapPin size={14} color="#666" />
                                  <Text style={styles.timelineLocation}>
                                    {item.notes || item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </SwipeableCard>
              ))}
            </View>
          )}

          {pastPlans.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Plans</Text>
              {pastPlans.map(plan => (
                <SwipeableCard key={plan.id} plan={plan} onDelete={handleDeletePlan}>
                  <TouchableOpacity 
                    style={styles.pastPlanCard}
                    onPress={() => {
                      const firstItem = plan.itinerary[0];
                      if (firstItem) {
                        router.push(`/${firstItem.type}/${firstItem.itemId}`);
                      }
                    }}>
                    {plan.itinerary[0] && details[plan.itinerary[0].itemId] && (
                      <Image
                        source={{ uri: details[plan.itinerary[0].itemId].images?.[0] || 
                                     details[plan.itinerary[0].itemId].image }}
                        style={styles.pastPlanImage}
                      />
                    )}
                    <View style={styles.pastPlanContent}>
                      <Text style={styles.pastPlanTitle}>{plan.title}</Text>
                      <Text style={styles.pastPlanDate}>
                        {new Date(plan.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </SwipeableCard>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 88 : 68, // Add padding for tab bar
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
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
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  planDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planDateText: {
    fontSize: 14,
    color: '#666',
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  timelineImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  timelineDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineLocation: {
    fontSize: 14,
    color: '#666',
  },
  pastPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pastPlanImage: {
    width: '100%',
    height: 160,
  },
  pastPlanContent: {
    padding: 16,
    gap: 4,
  },
  pastPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pastPlanDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeableContainer: {
    position: 'relative',
  },
  swipeableContent: {
    backgroundColor: '#fff',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 75,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});