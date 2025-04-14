import { Stack } from 'expo-router';

export default function LodgeLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{
          headerShown: false,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}