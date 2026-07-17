export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string;
          teacher_id: string;
          title: string;
          storage_path: string;
          collect_data: boolean;
          share_slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          title: string;
          storage_path: string;
          collect_data?: boolean;
          share_slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          title?: string;
          storage_path?: string;
          collect_data?: boolean;
          share_slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          activity_id: string;
          student_name: string;
          structured_data: Json | null;
          status: "draft" | "complete";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          student_name: string;
          structured_data?: Json | null;
          status?: "draft" | "complete";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          student_name?: string;
          structured_data?: Json | null;
          status?: "draft" | "complete";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_activity_id_fkey";
            columns: ["activity_id"];
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
