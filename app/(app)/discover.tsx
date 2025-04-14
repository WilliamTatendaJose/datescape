import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Filter, MapPin } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { getRestaurants } from '@/lib/services/restaurants';
import { getEvents } from '@/lib/services/events';
import { getLodges } from '@/lib/services/lodges';
import type { Restaurant } from '@/lib/services/restaurants';
import type { Event } from '@/lib/services/events';
import type { Lodge } from '@/lib/services/lodges';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import debounce from 'lodash/debounce';

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];
const CUISINE_TYPES = ['Italian', 'Japanese', 'Indian', 'American', 'French', 'Mediterranean'];
const EVENT_TYPES = ['Music', 'Art', 'Food', 'Sports', 'Cultural', 'Outdoor'];
const LODGE_TYPES = ['Hotel', 'Resort', 'Villa', 'Boutique', 'Luxury'];

export default function DiscoverScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [] as string[],
    cuisineTypes: [] as string[],
    eventTypes: [] as string[],
    lodgeTypes: [] as string[]
  });

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        fetchData();
        return;
      }

      setSearching(true);
      try {
        const [restaurantResults, eventResults, lodgeResults] = await Promise.all([
          getRestaurants({
            searchText: query,
            priceRange: filters.priceRange[0], // Use first selected price range
            tags: filters.cuisineTypes,
            limit: 20
          }),
          getEvents({
            searchText: query,
            tags: filters.eventTypes,
            limit: 20
          }),
          getLodges({
            searchText: query,
            tags: filters.lodgeTypes,
            limit: 20
          })
        ]);

        setRestaurants(restaurantResults.items || []);
        setEvents(eventResults.items || []);
        setLodges(lodgeResults.items || []);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setSearching(false);
      }
    }, 300),
    [filters]
  );

  async function fetchData() {
    setLoading(true);
    try {
      const [restaurantResults, eventResults, lodgeResults] = await Promise.all([
        getRestaurants({
          priceRange: filters.priceRange[0], // Use first selected price range
          tags: filters.cuisineTypes,
          limit: 20
        }),
        getEvents({
          tags: filters.eventTypes,
          limit: 20
        }),
        getLodges({
          tags: filters.lodgeTypes,
          limit: 20
        })
      ]);

      setRestaurants(restaurantResults.items || []);
      setEvents(eventResults.items || []);
      setLodges(lodgeResults.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants, events, or lodges"
              placeholderTextColor="#666"
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}>
            <Filter size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <LoadingIndicator text="Finding perfect spots..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, events, or lodges"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
          {searching && (
            <ActivityIndicator style={styles.searchingIndicator} />
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filters.priceRange.length > 0 || 
            filters.cuisineTypes.length > 0 || 
            filters.eventTypes.length > 0 || 
            filters.lodgeTypes.length > 0 ? styles.filterActive : null
          ]}
          onPress={() => setShowFilters(true)}>
          <Filter size={20} color={filters.priceRange.length > 0 || 
            filters.cuisineTypes.length > 0 || 
            filters.eventTypes.length > 0 || 
            filters.lodgeTypes.length > 0 ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurants</Text>
          <View style={styles.grid}>
            {restaurants.map((restaurant) => (
              <TouchableOpacity 
                key={restaurant.id} 
                style={styles.card}
                onPress={() => router.push(`/restaurant/${restaurant.id}`)}>
                <Image
                  source={{ uri: restaurant.images[0] }}
                  style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{restaurant.name}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.rating}>⭐ {restaurant.rating}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.category}>{restaurant.tags[0]}</Text>
                  </View>
                  <View style={styles.location}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.locationText}>{restaurant.location.address}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Events</Text>
          <View style={styles.grid}>
            {events.map((event) => (
              <TouchableOpacity 
                key={event.id} 
                style={styles.card}
                onPress={() => router.push(`/event/${event.id}`)}>
                <Image
                  source={{ uri: event.image }}
                  style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.category}>📅 {new Date(event.date).toLocaleDateString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lodges</Text>
          <View style={styles.grid}>
            {lodges.map((lodge) => (
              <TouchableOpacity 
                key={lodge.id} 
                style={styles.card}
                onPress={() => router.push(`/lodge/${lodge.id}`)}>
                <Image
                  source={{ uri: lodge.images[0] }}
                  style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{lodge.name}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.rating}>⭐ {lodge.rating}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.category}>{lodge.tags[0]}</Text>
                  </View>
                  <Text style={styles.price}>${lodge.pricePerNight}/night</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {showFilters && (
        <View style={styles.filtersOverlay}>
          <View style={styles.filtersContent}>
            <Text style={styles.filtersTitle}>Filters</Text>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.filterOptions}>
                {PRICE_RANGES.map(price => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.filterOption,
                      filters.priceRange.includes(price) && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        priceRange: prev.priceRange.includes(price)
                          ? prev.priceRange.filter(p => p !== price)
                          : [...prev.priceRange, price]
                      }));
                    }}>
                    <Text style={[
                      styles.filterOptionText,
                      filters.priceRange.includes(price) && styles.filterOptionTextActive
                    ]}>{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Cuisine Types</Text>
              <View style={styles.filterOptions}>
                {CUISINE_TYPES.map(cuisine => (
                  <TouchableOpacity
                    key={cuisine}
                    style={[
                      styles.filterOption,
                      filters.cuisineTypes.includes(cuisine) && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        cuisineTypes: prev.cuisineTypes.includes(cuisine)
                          ? prev.cuisineTypes.filter(c => c !== cuisine)
                          : [...prev.cuisineTypes, cuisine]
                      }));
                    }}>
                    <Text style={[
                      styles.filterOptionText,
                      filters.cuisineTypes.includes(cuisine) && styles.filterOptionTextActive
                    ]}>{cuisine}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.clearFilters}
                onPress={() => {
                  setFilters({
                    priceRange: [],
                    cuisineTypes: [],
                    eventTypes: [],
                    lodgeTypes: []
                  });
                }}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyFilters}
                onPress={() => setShowFilters(false)}>
                <Text style={styles.applyFiltersText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    fontSize: 14,
    color: '#666',
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingIndicator: {
    marginLeft: 8,
  },
  filterActive: {
    backgroundColor: '#000',
  },
  filtersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  filtersTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterOptionText: {
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  clearFilters: {
    padding: 12,
  },
  clearFiltersText: {
    color: '#666',
  },
  applyFilters: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  applyFiltersText: {
    color: '#fff',
    fontWeight: '600',
  },
});