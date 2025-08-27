import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';


import { Website } from '@/types/database';


interface WebsiteCardProps {
  website: Website;
  onPress?: () => void;
  onDelete?: () => void;
  theme: 'terminal';
}

export function WebsiteCard({ website, onPress }: WebsiteCardProps) {

  const handlePress = () => {

    if (onPress) {
      onPress();
    } else {
      router.push(`/website/${website.id}`);
    }
  };

  const formatLastChecked = (lastChecked: string | null) => {
    if (!lastChecked) return 'NEVER';
    const date = new Date(lastChecked);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const getStatusSymbol = () => {
    switch (website.status) {
      case 'online':
        return '[●]';
      case 'offline':
        return '[○]';
      case 'checking':
        return '[?]';
      default:
        return '[○]';
    }
  };

  const getStatusColor = () => {
    switch (website.status) {
      case 'online':
        return '#00ff00';
      case 'offline':
        return '#ff6b6b';
      case 'checking':
        return '#ffb000';
      default:
        return '#808080';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.line}>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusSymbol()}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {website.name.padEnd(20).substring(0, 20)}
        </Text>
        <Text style={styles.uptime}>
          {website.uptime_percentage.toFixed(1)}%
        </Text>
        <Text style={styles.lastChecked}>
          {formatLastChecked(website.last_checked)}
        </Text>
      </View>
      
      <View style={styles.urlLine}>
        <Text style={styles.urlPrefix}>└─</Text>
        <Text style={styles.url} numberOfLines={1}>
          {website.url}
        </Text>
      </View>
      
      {website.last_error && (
        <View style={styles.errorLine}>
          <Text style={styles.errorPrefix}>└─ ERROR:</Text>
          <Text style={styles.error} numberOfLines={1}>
            {website.last_error}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 14,
    marginBottom: 12,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  status: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: 'bold' as const,
    width: 24,
  },
  name: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ffffff',
    fontWeight: 'bold' as const,
    flex: 1,
    marginRight: 8,
  },
  uptime: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    width: 50,
    textAlign: 'right' as const,
    marginRight: 8,
  },
  lastChecked: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#808080',
    width: 40,
    textAlign: 'right' as const,
  },
  urlLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urlPrefix: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#555555',
    marginRight: 4,
  },
  url: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#808080',
    flex: 1,
  },
  errorLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorPrefix: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ff6b6b',
    marginRight: 4,
  },
  error: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ff6b6b',
    flex: 1,
  },
});