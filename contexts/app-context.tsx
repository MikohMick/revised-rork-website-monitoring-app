import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import { Website, WebsiteInsert, WebsiteUpdate } from '@/types/database';


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

export const [AppProvider, useApp] = createContextHook(() => {
  const [theme] = useState<Theme>('terminal');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isCheckingStatuses, setIsCheckingStatuses] = useState<boolean>(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initializeConnection = async () => {
      setConnectionStatus('checking');
      const result = await testSupabaseConnection();
      if (result.success) {
        console.log('[Terminal] Database connection established');
        setConnectionStatus('connected');
      } else {
        console.log('[Terminal] Database connection failed:', result.error);
        setConnectionStatus('disconnected');
      }
    };

    initializeConnection();
  }, []);

  const websitesQuery = useQuery({
    queryKey: ['websites', connectionStatus],
    queryFn: async () => {
      console.log('[Terminal] > ls websites');
      
      if (connectionStatus === 'disconnected') {
        throw new Error('Database connection unavailable');
      }
      
      try {
        const { data, error } = await supabase
          .from('websites')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Terminal] Database error:', formatError(error));
          setConnectionStatus('disconnected');
          throw error;
        }

        console.log(`[Terminal] Fetched ${data?.length ?? 0} websites from database`);
        return (data ?? []) as Website[];
      } catch (err) {
        console.error('[Terminal] Connection error:', formatError(err));
        setConnectionStatus('disconnected');
        throw err;
      }
    },
    enabled: connectionStatus === 'connected',
    retry: 2,
    retryDelay: 2000,
  });

  const checkWebsiteStatus = useCallback(async (url: string): Promise<{ status: 'online' | 'offline'; error?: string }> => {
    try {
      console.log(`[Terminal] > ping ${url}`);
      
      // Ensure URL has protocol
      const testUrl = url.startsWith('http') ? url : `https://${url}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Website-Monitor/1.0',
        },
      });

      clearTimeout(timeoutId);

      const isOnline = response.status >= 200 && response.status < 400;
      console.log(`[Terminal] ${testUrl} responded with ${response.status} - ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
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
      if (connectionStatus !== 'connected') {
        throw new Error('Database connection required to update status');
      }
      
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

      console.log(`[Terminal] Status updated: ${website.name} [${status.toUpperCase()}]`);

      const { data, error: updateError } = await supabase
        .from('websites')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[Terminal] Database update error:', formatError(updateError));
        throw updateError;
      }

      console.log('[Terminal] Status saved to database');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const addWebsiteMutation = useMutation({
    mutationFn: async (website: WebsiteInsert) => {
      console.log(`[Terminal] > add ${website.name} ${website.url}`);
      
      if (connectionStatus !== 'connected') {
        throw new Error('Database connection required to add websites');
      }

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

      const { data, error } = await supabase
        .from('websites')
        .insert(websiteWithId as any)
        .select()
        .single();

      if (error) {
        console.error('[Terminal] Database insert error:', formatError(error));
        throw error;
      }

      console.log('[Terminal] Website added to database');
      
      // Immediately check the status of the new website
      setTimeout(async () => {
        try {
          const result = await checkWebsiteStatus(website.url);
          updateWebsiteStatusMutation.mutate({
            id: data.id,
            status: result.status,
            error: result.error,
          });
        } catch (err) {
          console.log('[Terminal] Error checking new website status:', formatError(err));
        }
      }, 1000);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`[Terminal] > rm ${id}`);
      
      if (connectionStatus !== 'connected') {
        throw new Error('Database connection required to delete websites');
      }

      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Terminal] Database delete error:', formatError(error));
        throw error;
      }

      console.log('[Terminal] Website deleted from database');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const { mutateAsync: updateWebsiteStatusAsync } = updateWebsiteStatusMutation;
  
  const refreshAllStatuses = useCallback(async () => {
    if (connectionStatus !== 'connected' || !websitesQuery.data?.length) {
      return;
    }
    
    setIsCheckingStatuses(true);
    console.log('[Terminal] > refresh all');
    
    const promises = websitesQuery.data.map(async (website: Website) => {
      try {
        const result = await checkWebsiteStatus(website.url);
        return updateWebsiteStatusAsync({
          id: website.id,
          status: result.status,
          error: result.error,
        });
      } catch (error) {
        console.log('[Terminal] Error checking website status:', formatError(error));
        return null;
      }
    });
    
    await Promise.allSettled(promises);
    setIsCheckingStatuses(false);
  }, [connectionStatus, websitesQuery.data, checkWebsiteStatus, updateWebsiteStatusAsync]);

  const filteredWebsites = useMemo(() => {
    return (
      websitesQuery.data?.filter((website: Website) =>
        website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.url.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? []
    );
  }, [websitesQuery.data, searchQuery]);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
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

  return {
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
    refreshAllStatuses,
    isAddingWebsite: addWebsiteMutation.isPending,
    isDeletingWebsite: deleteWebsiteMutation.isPending,
    isUpdatingStatus: updateWebsiteStatusMutation.isPending,
    isCheckingStatuses,
  };
});