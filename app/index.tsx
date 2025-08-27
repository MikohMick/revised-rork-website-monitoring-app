import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Plus, RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react-native';
import { useApp } from '@/contexts/app-context';
import { WebsiteCard } from '@/components/website-card';
import * as Haptics from 'expo-haptics';
import { Website } from '@/types/database';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    connectionStatus,
    searchQuery,
    setSearchQuery,
    filteredWebsites,
    error,
    refreshAllStatuses,
    deleteWebsite,
    isCheckingStatuses,
    isLoading,
  } = useApp();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await refreshAllStatuses();
    setRefreshing(false);
  };

  const handleDeleteWebsite = (id: string, name: string) => {
    Alert.alert(
      'rm: remove website?',
      `Delete "${name}" from monitoring?`,
      [
        { text: 'n', style: 'cancel' },
        {
          text: 'y',
          style: 'destructive',
          onPress: () => {
            console.log(`[Terminal] > rm ${name}`);
            deleteWebsite(id);
          },
        },
      ]
    );
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi color="#00ff00" size={18} />;
      case 'disconnected':
        return <WifiOff color="#ff6b6b" size={18} />;
      case 'checking':
        return <Activity color="#ffb000" size={18} />;
      default:
        return <WifiOff color="#ff6b6b" size={18} />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'DB_ONLINE';
      case 'disconnected':
        return 'DB_OFFLINE';
      case 'checking':
        return 'CONNECTING';
      default:
        return 'OFFLINE';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    header: {
      backgroundColor: '#000000',
      paddingHorizontal: 16,
      paddingVertical: 2,
      borderBottomWidth: 1,
      borderBottomColor: '#333333',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#00ff00',
      fontWeight: 'bold' as const,
      letterSpacing: 0.5,
    },
    headerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectionText: {
      fontSize: 12,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#808080',
      marginLeft: 6,
    },
    timeText: {
      fontSize: 12,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#808080',
      marginLeft: 12,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIconButton: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#333333',
      backgroundColor: '#0a0a0a',
      marginRight: 24,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111111',
      borderWidth: 1,
      borderColor: '#333333',
      paddingHorizontal: 14,
      paddingVertical: 10,
      margin: 16,
    },
    searchPrompt: {
      fontSize: 16,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#00ff00',
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#ffffff',
      padding: 0,
    },
    content: {
      flex: 1,
    },
    statsContainer: {
      backgroundColor: '#111111',
      borderWidth: 1,
      borderColor: '#333333',
      padding: 16,
      marginBottom: 16,
    },
    statsHeader: {
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#00ff00',
      marginBottom: 10,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#808080',
    },
    statValue: {
      fontSize: 12,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      fontWeight: 'bold' as const,
    },
    websitesList: {
      gap: 12,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#808080',
      textAlign: 'center',
      marginBottom: 24,
    },
    addButton: {
      backgroundColor: '#111111',
      borderWidth: 1,
      borderColor: '#00ff00',
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#00ff00',
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      fontWeight: 'bold' as const,
      marginLeft: 8,
    },
    errorText: {
      color: '#ff6b6b',
      textAlign: 'center',
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      margin: 20,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#00ff00',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#0a0a0a',
      shadowColor: '#00ff00',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#ffb000',
      textAlign: 'center',
      marginTop: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorDetails: {
      fontSize: 12,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#808080',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111111',
      borderWidth: 1,
      borderColor: '#00ff00',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    retryText: {
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
      color: '#00ff00',
      fontWeight: 'bold' as const,
    },
  });

  const onlineCount = filteredWebsites.filter((w: Website) => w.status === 'online').length;
  const offlineCount = filteredWebsites.filter((w: Website) => w.status === 'offline').length;
  const checkingCount = filteredWebsites.filter((w: Website) => w.status === 'checking').length;
  const totalCount = filteredWebsites.length;

  if (connectionStatus === 'checking' || (connectionStatus === 'connected' && isLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Activity color="#ffb000" size={32} />
          <Text style={styles.loadingText}>
            {connectionStatus === 'checking' ? 'CONNECTING TO DATABASE...' : 'LOADING WEBSITES...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>[ERROR] Failed to load websites</Text>
          <Text style={styles.errorDetails}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => Platform.OS === 'web' ? window.location.reload() : null}>
            <RefreshCw color="#00ff00" size={16} />
            <Text style={styles.retryText}>RETRY CONNECTION</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>[ERROR] Database connection failed</Text>
          <Text style={styles.errorDetails}>Please check your internet connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => Platform.OS === 'web' ? window.location.reload() : null}>
            <RefreshCw color="#00ff00" size={16} />
            <Text style={styles.retryText}>RETRY CONNECTION</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top, paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }]} testID="header">
        <View style={styles.headerTop} testID="headerTop">
          <Text style={styles.headerTitle}>WEBSITE_MONITOR v1.0</Text>
          <View style={styles.headerInfo} testID="headerInfo">
            <View style={styles.connectionStatus}>
              {getConnectionIcon()}
              <Text style={styles.connectionText}>{getConnectionText()}</Text>
            </View>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>
        <View style={styles.headerActions} testID="headerActions">
          <TouchableOpacity onPress={onRefresh} disabled={refreshing || isCheckingStatuses} style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} testID="refreshButton">
            <RefreshCw color={(refreshing || isCheckingStatuses) ? '#808080' : '#00ff00'} size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/add-website')} style={styles.headerIconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} testID="addHeaderButton">
            <Plus color="#00ff00" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchContainer, { marginLeft: Math.max(16, insets.left), marginRight: Math.max(16, insets.right) }]}>
        <Text style={styles.searchPrompt}>$</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="grep -i 'website_name'"
          placeholderTextColor="#555555"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={[styles.content, { paddingHorizontal: Math.max(16, insets.left) }]}
        contentContainerStyle={{ paddingBottom: 96 + insets.bottom, paddingRight: Math.max(16, insets.right) }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || isCheckingStatuses} 
            onRefresh={onRefresh}
            tintColor="#00ff00"
            colors={['#00ff00']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {totalCount > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsHeader}>SYSTEM STATUS</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>ONLINE:</Text>
              <Text style={[styles.statValue, { color: '#00ff00' }]}>{onlineCount}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>OFFLINE:</Text>
              <Text style={[styles.statValue, { color: '#ff6b6b' }]}>{offlineCount}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>CHECKING:</Text>
              <Text style={[styles.statValue, { color: '#ffb000' }]}>{checkingCount}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>TOTAL:</Text>
              <Text style={[styles.statValue, { color: '#ffffff' }]}>{totalCount}</Text>
            </View>
          </View>
        )}

        {filteredWebsites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? '> No results found'
                : '> No websites configured\n> Use "add" command to start monitoring'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/add-website')}
              >
                <Plus color="#00ff00" size={16} />
                <Text style={styles.addButtonText}>ADD WEBSITE</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.websitesList}>
            {filteredWebsites.map((website: Website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                onPress={() => router.push(`/website/${website.id}`)}
                onDelete={() => handleDeleteWebsite(website.id, website.name)}
                theme="terminal"
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push('/add-website')}
        style={[styles.fab, { bottom: 24 + insets.bottom, right: Math.max(20, insets.right) }]}
        activeOpacity={0.9}
        testID="fabAdd"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Plus color="#000000" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}