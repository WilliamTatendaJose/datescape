import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface AnimatedTabIconProps {
  Icon: LucideIcon;
  color: string;
  size: number;
  focused: boolean;
}

export default function AnimatedTabIcon({ Icon, color, size, focused }: AnimatedTabIconProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1.2,
          useNativeDriver: true,
          damping: 10,
        }),
        Animated.spring(opacityValue, {
          toValue: 1,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          damping: 10,
        }),
        Animated.spring(opacityValue, {
          toValue: 0.7,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
        opacity: opacityValue,
      }}>
      <Icon 
        size={size - 2} 
        color={color} 
        strokeWidth={focused ? 2.5 : 2}
      />
    </Animated.View>
  );
}