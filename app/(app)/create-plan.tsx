import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Coffee, Utensils, Tent } from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import { createPlan } from '@/lib/services/plans';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

const vibeOptions = [
  { id: 'romantic', label: 'Romantic', icon: Heart, color: '#E57373' },
  { id: 'chill', label: 'Chill', icon: Coffee, color: '#64B5F6' },
  { id: 'foodie', label: 'Foodie', icon: Utensils, color: '#81C784' },
  { id: 'adventure', label: 'Adventure', icon: Tent, color: '#FFB74D' },
];

export default function CreatePlanScreen() {
  const router = useRouter();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [budget, setBudget] = useState(1); // 0: Low, 1: Medium, 2: High
  const [loading, setLoading] = useState(false);

  const handleVibeSelect = (vibeId: string) => {
    setSelectedVibe(vibeId === selectedVibe ? null : vibeId);
  };

  const handleBudgetChange = (value: number) => {
    setBudget(value);
  };

  const handleInspireMe = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to create a plan');
      return;
    }

    setLoading(true);
    try {
      // Create an empty plan with the selected preferences
      const dateStr = new Date().toISOString().split('T')[0];
      const newPlan = await createPlan({
        userId: auth.currentUser.uid,
        title: 'New Date Plan',
        date: dateStr,
        vibe: selectedVibe || undefined,
        budget: ['low', 'medium', 'high'][budget],
        itinerary: []
      });

      if (newPlan) {
        // Navigate to the suggested plan screen with the plan ID
        router.push({
          pathname: '/suggested-plan',
          params: { planId: newPlan.id }
        });
      } else {
        alert('Failed to create plan. Please try again.');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vibe & Budget Setup</Text>
        <Text style={styles.subtitle}>Choose a vibe and a budget to get started</Text>

        <View style={styles.vibeContainer}>
          {vibeOptions.map((vibe) => (
            <TouchableOpacity
              key={vibe.id}
              style={[
                styles.vibeOption,
                selectedVibe === vibe.id && styles.selectedVibeOption
              ]}
              onPress={() => handleVibeSelect(vibe.id)}
            >
              <vibe.icon
                size={24}
                color={selectedVibe === vibe.id ? '#fff' : vibe.color}
              />
              <Text
                style={[
                  styles.vibeLabel,
                  selectedVibe === vibe.id && styles.selectedVibeLabel
                ]}
              >
                {vibe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.budgetContainer}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.budgetSlider}>
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  { width: `${(budget / 2) * 100}%` }
                ]}
              />
            </View>
            <View style={styles.budgetMarkers}>
              <TouchableOpacity
                style={[
                  styles.budgetMarker,
                  budget >= 0 && styles.activeBudgetMarker
                ]}
                onPress={() => handleBudgetChange(0)}
              />
              <TouchableOpacity
                style={[
                  styles.budgetMarker,
                  budget >= 1 && styles.activeBudgetMarker
                ]}
                onPress={() => handleBudgetChange(1)}
              />
              <TouchableOpacity
                style={[
                  styles.budgetMarker,
                  budget >= 2 && styles.activeBudgetMarker
                ]}
                onPress={() => handleBudgetChange(2)}
              />
            </View>
            <View style={styles.budgetLabels}>
              <Text style={styles.budgetLabel}>Low</Text>
              <Text style={styles.budgetLabel}>Medium</Text>
              <Text style={styles.budgetLabel}>High</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.inspireButton}
          onPress={handleInspireMe}
          disabled={loading}
        >
          {loading ? (
            <LoadingIndicator color="#fff" text="Inspiring..." />
          ) : (
            <Text style={styles.inspireButtonText}>Inspire Me</Text>
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
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  vibeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  vibeOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  selectedVibeOption: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  vibeLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedVibeLabel: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  budgetContainer: {
    marginBottom: 30,
  },
  budgetSlider: {
    marginTop: 20,
  },
  budgetTrack: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 16,
  },
  budgetFill: {
    height: 4,
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
  budgetMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  activeBudgetMarker: {
    backgroundColor: '#2E7D32',
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  inspireButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  inspireButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
