import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'checking';
  size?: number;
  theme: 'light' | 'dark';
}

export function StatusIndicator({ status, size = 12, theme }: StatusIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'checking') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getColor = () => {
    switch (status) {
      case 'online':
        return '#22C55E';
      case 'offline':
        return '#EF4444';
      case 'checking':
        return theme === 'dark' ? '#9CA3AF' : '#6B7280';
      default:
        return theme === 'dark' ? '#9CA3AF' : '#6B7280';
    }
  };

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          width: size,
          height: size,
          backgroundColor: getColor(),
          opacity: pulseAnim,
        },
      ]}
      testID="status-indicator"
    />
  );
}

const styles = StyleSheet.create({
  indicator: {
    borderRadius: 50,
  },
});