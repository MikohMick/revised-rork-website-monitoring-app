export interface Database {
  public: {
    Tables: {
      websites: {
        Row: {
          id: string;
          name: string;
          url: string;
          status: 'online' | 'offline' | 'checking';
          uptime: number;
          downtime: number;
          last_checked: string | null;
          created_at: string;
          uptime_percentage: number;
          last_error: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          status?: 'online' | 'offline' | 'checking';
          uptime?: number;
          downtime?: number;
          last_checked?: string | null;
          created_at?: string;
          uptime_percentage?: number;
          last_error?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          status?: 'online' | 'offline' | 'checking';
          uptime?: number;
          downtime?: number;
          last_checked?: string | null;
          created_at?: string;
          uptime_percentage?: number;
          last_error?: string | null;
        };
      };
    };
  };
}

export type Website = Database['public']['Tables']['websites']['Row'];
export type WebsiteInsert = Database['public']['Tables']['websites']['Insert'];
export type WebsiteUpdate = Database['public']['Tables']['websites']['Update'];