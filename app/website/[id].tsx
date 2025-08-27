import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Trash2, RefreshCw, Loader, ExternalLink, Terminal } from 'lucide-react-native';

import { useApp } from '@/contexts/app-context';
import { Website } from '@/types/database';

export default function WebsiteDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    websites,
    deleteWebsite,
    checkWebsiteStatus,
    updateWebsiteStatus,
    isDeletingWebsite,
    isUpdatingStatus,
  } = useApp();
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const website = websites.find((w: Website) => w.id === id);

  useEffect(() => {
    if (!website) {
      router.back();
    }
  }, [website]);

  if (!website) {
    return null;
  }

  const handleOpenWebsite = async () => {
    try {
      console.log(`[Terminal] > open ${website.url}`);
      const supported = await Linking.canOpenURL(website.url);
      if (supported) {
        await Linking.openURL(website.url);
      } else {
        Alert.alert('EXEC_ERROR', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('EXEC_ERROR', 'Failed to open browser');
    }
  };

  const handleCheckStatus = async () => {
    if (isChecking || isUpdatingStatus) return;

    setIsChecking(true);
    try {

      
      console.log(`[Terminal] > ping ${website.url}`);
      const result = await checkWebsiteStatus(website.url);
      updateWebsiteStatus({
        id: website.id,
        status: result.status,
        error: result.error,
      });
    } catch {
      Alert.alert('PING_ERROR', 'Failed to check website status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDeleteWebsite = () => {
    Alert.alert(
      'rm: remove target?',
      `Delete "${website.name}" from monitoring?`,
      [
        { text: 'n', style: 'cancel' },
        {
          text: 'y',
          style: 'destructive',
          onPress: () => {

            console.log(`[Terminal] > rm ${website.name}`);
            deleteWebsite(website.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d_${hours}h`;
    if (hours > 0) return `${hours}h_${minutes}m`;
    return `${minutes}m`;
  };

  const formatLastChecked = (lastChecked: string | null) => {
    if (!lastChecked) return 'NEVER';
    const date = new Date(lastChecked);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}m_AGO`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h_AGO`;
    return `${Math.floor(diffMins / 1440)}d_AGO`;
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: website.name.toUpperCase(),
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#00ff00',
          headerTitleStyle: {
            fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
            fontSize: 16,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="backButton"
            >
              <ArrowLeft size={22} color="#00ff00" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={handleDeleteWebsite}
              disabled={isDeletingWebsite}
              testID="deleteButton"
            >
              <Trash2 size={22} color={isDeletingWebsite ? '#555555' : '#ff6b6b'} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={[styles.scrollView]} contentContainerStyle={{ paddingBottom: 24 + insets.bottom, paddingHorizontal: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.terminalHeader}>
            <Text style={styles.prompt}>$</Text>
            <Text style={styles.command}>status {website.name}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.statusLine}>
              <Text style={[styles.statusSymbol, { color: getStatusColor() }]}>
                {getStatusSymbol()}
              </Text>
              <Text style={styles.statusText}>
                {website.status.toUpperCase()}
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { opacity: (isChecking || isUpdatingStatus) ? 0.5 : 1 }
                ]}
                onPress={handleCheckStatus}
                disabled={isChecking || isUpdatingStatus}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="pingButton"
              >
                {isChecking || isUpdatingStatus ? (
                  <Loader size={16} color="#ffb000" />
                ) : (
                  <RefreshCw size={16} color="#00ff00" />
                )}
                <Text style={styles.refreshText}>
                  {isChecking || isUpdatingStatus ? 'PINGING...' : 'PING'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.urlLine}>
              <Text style={styles.urlPrefix}>└─ URL:</Text>
              <Text style={styles.url}>{website.url}</Text>
            </View>

            {website.last_error && (
              <View style={styles.errorLine}>
                <Text style={styles.errorPrefix}>└─ ERROR:</Text>
                <Text style={styles.error}>{website.last_error}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SYSTEM_METRICS</Text>
            
            <View style={styles.metricLine}>
              <Text style={styles.metricLabel}>UPTIME_PCT:</Text>
              <Text style={[styles.metricValue, { color: '#00ff00' }]}>
                {website.uptime_percentage.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.metricLine}>
              <Text style={styles.metricLabel}>TOTAL_UP:</Text>
              <Text style={styles.metricValue}>
                {formatDuration(website.uptime)}
              </Text>
            </View>

            <View style={styles.metricLine}>
              <Text style={styles.metricLabel}>TOTAL_DOWN:</Text>
              <Text style={[styles.metricValue, { color: '#ff6b6b' }]}>
                {formatDuration(website.downtime)}
              </Text>
            </View>

            <View style={styles.metricLine}>
              <Text style={styles.metricLabel}>LAST_CHECK:</Text>
              <Text style={styles.metricValue}>
                {formatLastChecked(website.last_checked)}
              </Text>
            </View>

            <View style={styles.metricLine}>
              <Text style={styles.metricLabel}>CREATED:</Text>
              <Text style={styles.metricValue}>
                {new Date(website.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenWebsite}
            >
              <Terminal size={16} color="#00ff00" />
              <Text style={styles.actionButtonText}>
                OPEN_BROWSER
              </Text>
              <ExternalLink size={14} color="#808080" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  prompt: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    marginRight: 8,
  },
  command: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 16,
    marginBottom: 16,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusSymbol: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: 'bold' as const,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ffffff',
    fontWeight: 'bold' as const,
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    minHeight: 44,
  },
  refreshText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    fontWeight: 'bold' as const,
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
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ff6b6b',
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    fontWeight: 'bold' as const,
    marginBottom: 12,
  },
  metricLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#808080',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ffffff',
    fontWeight: 'bold' as const,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#00ff00',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    fontWeight: 'bold' as const,
  },
});