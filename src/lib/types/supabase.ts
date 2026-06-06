export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Role = "participant" | "volunteer" | "admin" | "super_admin";
export type EventStatus = "draft" | "published" | "live" | "completed";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted";
export type ServiceTypeKey =
  | "entry"
  | "breakfast"
  | "lunch"
  | "snacks"
  | "dinner"
  | "kit"
  | "certificate";
export type ServiceClaimStatus = "verified" | "duplicate" | "invalid" | "manual_override";
export type EmailLogType =
  | "registration_confirmation"
  | "approval"
  | "qr_pass"
  | "meal_coupon"
  | "rejection";
export type EmailLogStatus = "pending" | "sent" | "failed";

type Timestamps = {
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Timestamps & {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: Role;
          avatar_url: string | null;
        };
        Insert: Partial<Timestamps> & {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: Role;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: Timestamps & {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          venue: string | null;
          start_date: string | null;
          end_date: string | null;
          registration_open: boolean;
          status: EventStatus;
          created_by: string | null;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          venue?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          registration_open?: boolean;
          status?: EventStatus;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: Timestamps & {
          id: string;
          event_id: string;
          team_name: string;
          leader_id: string | null;
          college_name: string | null;
          problem_track: string | null;
          project_idea: string | null;
          member_count: number;
          metadata: Json;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          event_id: string;
          team_name: string;
          leader_id?: string | null;
          college_name?: string | null;
          problem_track?: string | null;
          project_idea?: string | null;
          member_count?: number;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      participants: {
        Row: Timestamps & {
          id: string;
          user_id: string | null;
          event_id: string;
          team_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          college_name: string | null;
          department: string | null;
          year: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          registration_status: RegistrationStatus;
          qr_token_hash: string | null;
          qr_generated_at: string | null;
          metadata: Json;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          user_id?: string | null;
          event_id: string;
          team_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          college_name?: string | null;
          department?: string | null;
          year?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          registration_status?: RegistrationStatus;
          qr_token_hash?: string | null;
          qr_generated_at?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participants_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      service_types: {
        Row: Timestamps & {
          id: string;
          event_id: string;
          name: string;
          type: ServiceTypeKey;
          start_time: string | null;
          end_time: string | null;
          max_claims_per_participant: number;
          is_active: boolean;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          event_id: string;
          name: string;
          type: ServiceTypeKey;
          start_time?: string | null;
          end_time?: string | null;
          max_claims_per_participant?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["service_types"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "service_types_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      service_claims: {
        Row: Timestamps & {
          id: string;
          event_id: string;
          participant_id: string;
          service_type_id: string;
          scanned_by: string | null;
          status: ServiceClaimStatus;
          scanned_at: string;
          device_id: string | null;
          notes: string | null;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          event_id: string;
          participant_id: string;
          service_type_id: string;
          scanned_by?: string | null;
          status?: ServiceClaimStatus;
          scanned_at?: string;
          device_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["service_claims"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "service_claims_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_claims_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_claims_scanned_by_fkey";
            columns: ["scanned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_claims_service_type_id_fkey";
            columns: ["service_type_id"];
            isOneToOne: false;
            referencedRelation: "service_types";
            referencedColumns: ["id"];
          },
        ];
      };
      volunteers: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          event_id: string;
          assigned_service_id: string | null;
          duty_name: string | null;
          shift_start: string | null;
          shift_end: string | null;
          is_active: boolean;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          user_id: string;
          event_id: string;
          assigned_service_id?: string | null;
          duty_name?: string | null;
          shift_start?: string | null;
          shift_end?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["volunteers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "volunteers_assigned_service_id_fkey";
            columns: ["assigned_service_id"];
            isOneToOne: false;
            referencedRelation: "service_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteers_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      email_logs: {
        Row: Timestamps & {
          id: string;
          event_id: string | null;
          participant_id: string | null;
          recipient_email: string;
          email_type: EmailLogType;
          provider_message_id: string | null;
          status: EmailLogStatus;
          error_message: string | null;
          sent_at: string | null;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          event_id?: string | null;
          participant_id?: string | null;
          recipient_email: string;
          email_type: EmailLogType;
          provider_message_id?: string | null;
          status?: EmailLogStatus;
          error_message?: string | null;
          sent_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "email_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_logs_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: Timestamps & {
          id: string;
          actor_id: string | null;
          event_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
        };
        Insert: Partial<Timestamps> & {
          id?: string;
          actor_id?: string | null;
          event_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"];
export type ServiceTypeRow = Database["public"]["Tables"]["service_types"]["Row"];
export type ServiceClaimRow = Database["public"]["Tables"]["service_claims"]["Row"];
export type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
