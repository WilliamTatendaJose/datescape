import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabBarBackground() {
  const insets = useSafeAreaInsets();
  
  if (Platform.OS === 'android') {
    return (
      <View 
        style={[
          styles.container,
          { 
            height: 50,
            backgroundColor: '#fff',
          }
        ]} 
      />
    );
  }

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[
        styles.container,
        {
          height: 50,
          paddingBottom: insets.bottom,
        }
      ]}>
      <View style={styles.border} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
