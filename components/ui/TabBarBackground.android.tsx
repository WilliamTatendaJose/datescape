import { StyleSheet, View } from 'react-native';

export default function TabBarBackground() {
  return (
    <View 
      style={[
        styles.container,
        { 
          height: 48,
          paddingBottom: 10,
          marginTop: 10,
        }
      ]}>
      <View style={styles.border} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
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