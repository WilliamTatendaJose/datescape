import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Utensils, Music, Home } from 'lucide-react-native';
import { getPlan, updatePlan, Plan } from '@/lib/services/plans';
import { getRestaurant, Restaurant } from '@/lib/services/restaurants';
import { getEvent, Event } from '@/lib/services/events';
import { getLodge, Lodge } from '@/lib/services/lodges';
import { auth } from '@/lib/firebase';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import { cache } from '@/lib/utils/cache';

// Define types for timeline items
type IconComponent = typeof Utensils | typeof Music | typeof Home;

interface TimelineItem {
  id: string;
  type: 'restaurant' | 'event' | 'lodge';
  name?: string;
  title?: string;
  image?: string;
  images?: string[];
  notes?: string;
  time?: string;
  location?: string;
  icon: IconComponent;
}

export default function ReviewPlanScreen() {
  const { planId } = useLocalSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!planId) {
      router.replace('/plan');
      return;
    }

    const fetchPlanAndItems = async () => {
      try {
        setLoading(true);
        
        // Clear cache to ensure fresh data
        await cache.invalidate(`plan:${planId.toString()}`);
        
        const planData = await getPlan(planId.toString());
        if (!planData) {
          alert('Plan not found');
          router.replace('/plan');
          return;
        }

        setPlan(planData);
        setTitle(planData.title || 'New Date Plan');
        
        if (planData.date) {
          setDate(new Date(planData.date));
        }

        // Fetch details for all items in the itinerary
        const itemDetails: TimelineItem[] = [];
        if (planData.itinerary && planData.itinerary.length > 0) {
          console.log('Plan has itinerary items:', planData.itinerary);
          
          // Use Promise.all to fetch all items in parallel for better performance
          const fetchPromises = planData.itinerary.map(async (item) => {
            try {
              let details: Restaurant | Event | Lodge | null = null;
              let icon: IconComponent;
              
              switch (item.type) {
                case 'restaurant':
                  details = await getRestaurant(item.itemId);
                  icon = Utensils;
                  break;
                case 'event':
                  details = await getEvent(item.itemId);
                  icon = Music;
                  break;
                case 'lodge':
                  details = await getLodge(item.itemId);
                  icon = Home;
                  break;
                default:
                  icon = Utensils; // Default icon
                  break;
              }
              
              if (details) {
                // Add the icon and notes to the details
                const timelineItem: TimelineItem = {
                  id: item.itemId,
                  type: item.type,
                  icon,
                  notes: item.notes
                };
                
                // Use type guards to safely access properties
                if ('name' in details) {
                  timelineItem.name = details.name;
                } 
                if ('title' in details) {
                  timelineItem.title = details.title;
                }
                if ('images' in details && details.images && details.images.length > 0) {
                  timelineItem.image = details.images[0];
                } else if ('image' in details) {
                  timelineItem.image = details.image;
                }
                
                // Add default time based on item type
                if (item.type === 'restaurant') {
                  timelineItem.time = '7:00 PM';
                } else if (item.type === 'event') {
                  timelineItem.time = '9:00 PM';
                }
                
                // Add location if available
                if ('location' in details && details.location) {
                  timelineItem.location = details.location.address;
                }
                
                itemDetails.push(timelineItem);
                console.log(`Fetched ${item.type} details for timeline:`, timelineItem);
              } else {
                console.error(`Failed to fetch ${item.type} with ID:`, item.itemId);
              }
              
              return details;
            } catch (error) {
              console.error(`Error fetching ${item.type} with ID ${item.itemId}:`, error);
              return null;
            }
          });
          
          // Wait for all items to be fetched
          await Promise.all(fetchPromises);
        } else {
          console.log('Plan has no itinerary items');
        }

        // Sort items by type for consistent display
        itemDetails.sort((a, b) => {
          const typeOrder: Record<string, number> = { restaurant: 1, event: 2, lodge: 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        });
        
        console.log('Setting items:', itemDetails);
        setItems(itemDetails);
      } catch (error) {
        console.error('Error fetching plan:', error);
        alert('Failed to load plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndItems();
  }, [planId, router]);

  const handleDateChange = (selectedDate: Date) => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    // Create an array of dates for the next 14 days
    const dateOptions = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const newDate = new Date();
      newDate.setDate(today.getDate() + i);
      dateOptions.push(newDate);
    }
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select a Date</Text>
            <ScrollView style={styles.dateList}>
              {dateOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateOption,
                    new Date(option).toDateString() === new Date(date).toDateString() && styles.selectedDateOption
                  ]}
                  onPress={() => handleDateChange(option)}
                >
                  <Text style={[
                    styles.dateOptionText,
                    new Date(option).toDateString() === new Date(date).toDateString() && styles.selectedDateOptionText
                  ]}>
                    {formatDate(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to save a plan');
      return;
    }

    try {
      setSaving(true);
      
      // Format date as ISO string for storage
      const dateStr = date.toISOString().split('T')[0];
      
      // Update plan with title and date
      await updatePlan(planId.toString(), { 
        title, 
        date: dateStr
      });
      
      // Navigate to plans list
      router.replace('/plan');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator text="Loading your plan..." color="#E57373" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Review & Save</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name Your Plan</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a name for your plan"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#2E7D32" />
            <Text style={styles.dateText}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>
          
          {renderDatePicker()}
        </View>
        
        <View style={styles.timelineSection}>
          {items.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <item.icon size={24} color="#fff" />
              </View>
              
              <View style={[
                styles.timelineConnector, 
                index === items.length - 1 && styles.lastConnector
              ]} />
              
              <View style={styles.timelineContent}>
                <View style={styles.timelineCard}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.timelineImage} 
                  />
                  <View style={styles.timelineCardContent}>
                    <Text style={styles.timelineCardTitle}>{item.name || item.title}</Text>
                    
                    {item.time && (
                      <View style={styles.timelineDetail}>
                        <Clock size={16} color="#666" />
                        <Text style={styles.timelineDetailText}>{item.time}</Text>
                      </View>
                    )}
                    
                    {item.location && (
                      <View style={styles.timelineDetail}>
                        <MapPin size={16} color="#666" />
                        <Text style={styles.timelineDetailText}>{item.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <LoadingIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Plan</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 8,
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineConnector: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  lastConnector: {
    display: 'none',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
  },
  timelineCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timelineImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  timelineCardContent: {
    padding: 12,
  },
  timelineCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timelineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateOption: {
    backgroundColor: '#f0f0f0',
  },
  dateOptionText: {
    fontSize: 16,
  },
  selectedDateOptionText: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
