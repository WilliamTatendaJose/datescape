import { Tabs } from 'expo-router';
import { Chrome as Home, Search, Calendar, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import TabBarBackground from '@/components/ui/TabBarBackground';
import AnimatedTabIcon from '@/components/ui/AnimatedTabIcon';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 0,
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              Icon={Home}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              Icon={Search}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              Icon={Calendar}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              Icon={User}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      
      {/* Hide auxiliary screens from tab bar */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This removes it from tab bar but keeps it accessible via navigation
        }}
      />
      <Tabs.Screen
        name="event"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="restaurant"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="lodge"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}