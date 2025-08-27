import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import { Website, WebsiteInsert, WebsiteUpdate } from '@/types/database';
import { Platform } from 'react-native';

type Theme = 'terminal';

function formatError(err: unknown): string {
  if (err == null) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

const STORAGE_KEY = 'websites_data';

export const [AppProvider, useApp] = createContextHook(() => {
  const [theme] = useState<Theme>('terminal');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const queryClient = useQueryClient();

  useEffect(() => {
    const initializeConnection = async () => {
      setConnectionStatus('checking');
      const result = await testSupabaseConnection();
      if (result.success) {
        console.log('[Terminal] Database connection established');
        setConnectionStatus('connected');
      } else {
        console.log('[Terminal] Database connection failed, using local storage:', result.error);
        setConnectionStatus('disconnected');
      }
    };

    initializeConnection();
  }, []);

  const websitesQuery = useQuery({
    queryKey: ['websites', connectionStatus],
    queryFn: async () => {
      console.log('[Terminal] > ls websites');
      
      if (Platform.OS === 'web' || connectionStatus === 'disconnected') {
        console.log('[Terminal] Using local storage fallback');
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          const websites = stored ? JSON.parse(stored) : [];
          console.log(`[Terminal] Found ${websites.length} websites in local storage`);
          return websites as Website[];
        } catch (err) {
          console.log('[Terminal] Storage error:', formatError(err));
          return [];
        }
      }
      
      try {
        const { data, error } = await supabase
          .from('websites')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Terminal] Database error:', formatError(error));
          setConnectionStatus('disconnected');
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          return stored ? JSON.parse(stored) : [];
        }

        console.log(`[Terminal] Fetched ${data?.length ?? 0} websites from database`);
        return (data ?? []) as Website[];
      } catch (err) {
        console.error('[Terminal] Connection error:', formatError(err));
        setConnectionStatus('disconnected');
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          return stored ? JSON.parse(stored) : [];
        } catch {
          return [];
        }
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const addWebsiteMutation = useMutation({
    mutationFn: async (website: WebsiteInsert) => {
      console.log(`[Terminal] > add ${website.name} ${website.url}`);

      const websiteWithId = {
        ...website,
        id: website.id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`),
        created_at: new Date().toISOString(),
        status: 'checking' as const,
        uptime: 0,
        downtime: 0,
        uptime_percentage: 100,
        last_checked: null,
        last_error: null,
      };

      if (Platform.OS === 'web' || connectionStatus === 'disconnected') {
        const currentWebsites = websitesQuery.data || [];
        const updatedWebsites = [websiteWithId, ...currentWebsites];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
        console.log('[Terminal] Website added to local storage');
        return websiteWithId;
      }

      try {
        const { data, error } = await supabase
          .from('websites')
          .insert(websiteWithId as any)
          .select()
          .single();

        if (error) {
          console.error('[Terminal] Database insert error:', formatError(error));
          const currentWebsites = websitesQuery.data || [];
          const updatedWebsites = [websiteWithId, ...currentWebsites];
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
          return websiteWithId;
        }

        console.log('[Terminal] Website added to database');
        return data;
      } catch (err) {
        console.error('[Terminal] Add website error:', formatError(err));
        const currentWebsites = websitesQuery.data || [];
        const updatedWebsites = [websiteWithId, ...currentWebsites];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
        return websiteWithId;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`[Terminal] > rm ${id}`);
      
      if (Platform.OS === 'web' || connectionStatus === 'disconnected') {
        const currentWebsites = websitesQuery.data || [];
        const updatedWebsites = currentWebsites.filter((w: Website) => w.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
        console.log('[Terminal] Website deleted from local storage');
        return;
      }

      try {
        const { error } = await supabase
          .from('websites')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[Terminal] Database delete error:', formatError(error));
          const currentWebsites = websitesQuery.data || [];
          const updatedWebsites = currentWebsites.filter((w: Website) => w.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
          return;
        }

        console.log('[Terminal] Website deleted from database');
      } catch (err) {
        console.error('[Terminal] Delete website error:', formatError(err));
        const currentWebsites = websitesQuery.data || [];
        const updatedWebsites = currentWebsites.filter((w: Website) => w.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const checkWebsiteStatus = useCallback(async (url: string): Promise<{ status: 'online' | 'offline'; error?: string }> => {
    try {
      console.log(`[Terminal] > ping ${url}`);
      
      if (Platform.OS === 'web') {
        console.log('[Terminal] Web platform - simulating ping');
        return { status: Math.random() > 0.2 ? 'online' : 'offline' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isOnline = response.status >= 200 && response.status < 400;
      console.log(`[Terminal] ${url} responded with ${response.status} - ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      return {
        status: isOnline ? 'online' : 'offline',
        error: response.status >= 400 ? `HTTP ${response.status}` : undefined,
      };
    } catch (error) {
      console.log(`[Terminal] ${url} - CONNECTION FAILED`);
      return {
        status: 'offline',
        error: formatError(error),
      };
    }
  }, []);

  const updateWebsiteStatusMutation = useMutation({
    mutationFn: async ({ id, status, error }: { id: string; status: 'online' | 'offline'; error?: string }) => {
      const website = websitesQuery.data?.find((w: Website) => w.id === id);
      if (!website) throw new Error('Website not found');

      const now = new Date().toISOString();
      const timeDiff = website.last_checked
        ? Math.floor((new Date(now).getTime() - new Date(website.last_checked).getTime()) / 1000)
        : 0;

      const updates: WebsiteUpdate = {
        status,
        last_checked: now,
        last_error: error || null,
      };

      if (status === 'online') {
        updates.uptime = website.uptime + timeDiff;
        updates.downtime = website.downtime;
      } else {
        updates.uptime = website.uptime;
        updates.downtime = website.downtime + timeDiff;
      }

      const totalTime = (updates.uptime || 0) + (updates.downtime || 0);
      updates.uptime_percentage = totalTime > 0 ? ((updates.uptime || 0) / totalTime) * 100 : 100;

      const updatedWebsite = { ...website, ...updates };
      console.log(`[Terminal] Status updated: ${website.name} [${status.toUpperCase()}]`);

      if (Platform.OS === 'web' || connectionStatus === 'disconnected') {
        const currentWebsites = websitesQuery.data || [];
        const updatedWebsites = currentWebsites.map((w: Website) => w.id === id ? updatedWebsite : w);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
        console.log('[Terminal] Status saved to local storage');
        return updatedWebsite;
      }

      try {
        const { data, error: updateError } = await supabase
          .from('websites')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('[Terminal] Database update error:', formatError(updateError));
          const currentWebsites = websitesQuery.data || [];
          const updatedWebsites = currentWebsites.map((w: Website) => w.id === id ? updatedWebsite : w);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
          return updatedWebsite;
        }

        console.log('[Terminal] Status saved to database');
        return data;
      } catch (err) {
        console.error('[Terminal] Update website error:', formatError(err));
        const currentWebsites = websitesQuery.data || [];
        const updatedWebsites = currentWebsites.map((w: Website) => w.id === id ? updatedWebsite : w);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWebsites));
        return updatedWebsite;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const filteredWebsites = useMemo(() => {
    return (
      websitesQuery.data?.filter((website: Website) =>
        website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.url.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? []
    );
  }, [websitesQuery.data, searchQuery]);

  useEffect(() => {
    if (Platform.OS === 'web' || connectionStatus !== 'connected') {
      return;
    }

    console.log('[Terminal] Establishing real-time connection...');
    const subscription = supabase
      .channel('websites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'websites' }, () => {
        console.log('[Terminal] Real-time update received');
        queryClient.invalidateQueries({ queryKey: ['websites'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, connectionStatus]);

  return useMemo(() => ({
    theme,
    connectionStatus,
    searchQuery,
    setSearchQuery,
    websites: websitesQuery.data || [],
    filteredWebsites,
    isLoading: websitesQuery.isLoading,
    error: websitesQuery.error,
    addWebsite: addWebsiteMutation.mutate,
    deleteWebsite: deleteWebsiteMutation.mutate,
    checkWebsiteStatus,
    updateWebsiteStatus: updateWebsiteStatusMutation.mutate,
    isAddingWebsite: addWebsiteMutation.isPending,
    isDeletingWebsite: deleteWebsiteMutation.isPending,
    isUpdatingStatus: updateWebsiteStatusMutation.isPending,
  }), [
    theme,
    connectionStatus,
    searchQuery,
    setSearchQuery,
    websitesQuery.data,
    filteredWebsites,
    websitesQuery.isLoading,
    websitesQuery.error,
    addWebsiteMutation.mutate,
    deleteWebsiteMutation.mutate,
    checkWebsiteStatus,
    updateWebsiteStatusMutation.mutate,
    addWebsiteMutation.isPending,
    deleteWebsiteMutation.isPending,
    updateWebsiteStatusMutation.isPending,
  ]);
});