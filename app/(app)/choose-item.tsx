import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, Filter, MapPin, Star, ArrowLeft } from 'lucide-react-native';
import { getRestaurants, Restaurant } from '@/lib/services/restaurants';
import { getEvents, Event } from '@/lib/services/events';
import { getLodges, Lodge } from '@/lib/services/lodges';
import { getPlan, updatePlan, Plan } from '@/lib/services/plans';
import { cache } from '@/lib/utils/cache';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

type ItemType = 'restaurant' | 'event' | 'lodge';
type Item = Restaurant | Event | Lodge;

// Type guards to check what type of item we have
const isRestaurant = (item: Item): item is Restaurant => {
  return (item as Restaurant).priceRange !== undefined;
};

const isEvent = (item: Item): item is Event => {
  return (item as Event).title !== undefined;
};

const isLodge = (item: Item): item is Lodge => {
  return (item as Lodge).pricePerNight !== undefined;
};

export default function ChooseItemScreen() {
  const { planId, type } = useLocalSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    vibe: null,
    priceRange: null,
    rating: null
  });

  useEffect(() => {
    if (!planId || !type) {
      router.replace('/plan');
      return;
    }

    const fetchItems = async () => {
      try {
        let response;
        const itemType = type.toString() as ItemType;
        
        switch (itemType) {
          case 'restaurant':
            response = await getRestaurants();
            break;
          case 'event':
            response = await getEvents();
            break;
          case 'lodge':
            response = await getLodges();
            break;
          default:
            router.replace('/plan');
            return;
        }
        setItems(response.items || []);
      } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        alert(`Failed to load ${type}s. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [planId, type, router]);

  const getItemTitle = (item: Item): string => {
    if (isEvent(item)) {
      return item.title;
    } else if (isRestaurant(item) || isLodge(item)) {
      return item.name;
    }
    return '';
  };

  const getItemSubtitle = (item: Item): string => {
    return item.tags?.join(', ') || (isRestaurant(item) ? 'Restaurant' : isEvent(item) ? 'Event' : 'Lodge');
  };

  const getItemImage = (item: Item): string => {
    if (isEvent(item)) {
      return item.image || 'https://via.placeholder.com/300x150';
    } else if (isRestaurant(item) || isLodge(item)) {
      return item.images?.[0] || 'https://via.placeholder.com/300x150';
    }
    return 'https://via.placeholder.com/300x150';
  };

  const handleAddToPlan = async (item: Item) => {
    try {
      setLoading(true);
      
      // Get current plan
      const plan = await getPlan(planId?.toString() || '');
      if (!plan) {
        alert('Plan not found');
        router.replace('/plan');
        return;
      }
      
      // Create updated itinerary
      const itinerary = [...(plan.itinerary || [])];
      
      // Remove any existing item of the same type
      const itemType = type?.toString() as ItemType;
      const index = itinerary.findIndex(i => i.type === itemType);
      if (index !== -1) {
        itinerary.splice(index, 1);
      }
      
      // Add the new item with more detailed information
      const newItem = {
        type: itemType,
        itemId: item.id,
        notes: `${itemType === 'restaurant' ? 'Dinner at' : itemType === 'event' ? 'Attend' : 'Stay at'} ${getItemTitle(item)}`
      };
      
      console.log('Adding item to plan:', newItem);
      itinerary.push(newItem);
      
      // Update the plan with transaction to ensure data consistency
      const updateResult = await updatePlan(planId?.toString() || '', { 
        itinerary
      });
      
      if (!updateResult) {
        throw new Error('Failed to update plan');
      }
      
      console.log('Plan updated successfully with new item');
      
      // Clear cache to ensure fresh data
      await cache.invalidate(`plan:${planId?.toString()}`);
      
      // Navigate back to suggested plan
      router.push({
        pathname: '/suggested-plan',
        params: { planId: planId?.toString() }
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    // Apply search filter
    const title = getItemTitle(item)?.toLowerCase() || '';
    const subtitle = getItemSubtitle(item)?.toLowerCase() || '';
    const query = searchQuery?.toLowerCase() || '';
    
    if (query && !title.includes(query) && !subtitle.includes(query)) {
      return false;
    }
    
    // Apply other filters
    if (filters.vibe) {
      // Check for vibes property based on item type
      const hasMatchingVibe = 
        (isRestaurant(item) && item.vibes?.includes(filters.vibe)) || 
        (isLodge(item) && item.tags?.includes(filters.vibe));
      
      if (!hasMatchingVibe) {
        return false;
      }
    }
    
    if (filters.rating) {
      // Check for rating property based on item type
      const hasHighEnoughRating = 
        ((isRestaurant(item) || isLodge(item)) && item.rating >= filters.rating);
      
      if (!hasHighEnoughRating && !isEvent(item)) {
        return false;
      }
    }
    
    return true;
  });

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: getItemImage(item) }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{getItemTitle(item)}</Text>
            <Text style={styles.cardSubtitle}>{getItemSubtitle(item)}</Text>
          </View>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Star size={16} color="#FFB400" fill="#FFB400" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        
        {item.location && (
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.locationText}>
              {item.location.address || 'Location'}
              {item.distance && ` · ${item.distance} mi`}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddToPlan(item)}
        >
          <Text style={styles.addButtonText}>Select {item.type === 'restaurant' ? 'Restaurant' : item.type === 'event' ? 'Event' : 'Lodge'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Choose {type}</Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${type}s...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Filter size={20} color="#333" />
        <Text style={styles.filterText}>Filter</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sortButton}>
        <Text style={styles.sortText}>Sort</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator text="Loading items..." />
          <Text style={styles.loadingText}>Loading {type}s...</Text>
        </View>
      ) : (
        <>
          {renderHeader()}
          
          {renderSearchBar()}
          
          {showFilters && (
            <View style={styles.filtersContainer}>
              {/* Filter options would go here */}
            </View>
          )}
          
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No {type}s found</Text>
              </View>
            }
          />
        </>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 14,
    color: '#333',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Extra padding for list content
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFB400',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
