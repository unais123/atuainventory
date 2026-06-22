export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_no: string | null
          bank_iban: string | null
          bank_name: string | null
          company_name: string
          company_name_ar: string | null
          cr_number: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          company_name?: string
          company_name_ar?: string | null
          cr_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          company_name?: string
          company_name_ar?: string | null
          cr_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          created_at: string
          id: string
          item_name: string
          min_stock: number
          model: string | null
          purchase_price: number
          quantity: number
          selling_price: number
          serial_number: string | null
          supplier_id: string | null
          updated_at: string
          warehouse: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          item_name: string
          min_stock?: number
          model?: string | null
          purchase_price?: number
          quantity?: number
          selling_price?: number
          serial_number?: string | null
          supplier_id?: string | null
          updated_at?: string
          warehouse?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          item_name?: string
          min_stock?: number
          model?: string | null
          purchase_price?: number
          quantity?: number
          selling_price?: number
          serial_number?: string | null
          supplier_id?: string | null
          updated_at?: string
          warehouse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          notes: string | null
          performed_by: string | null
          quantity: number
          reference: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          notes?: string | null
          performed_by?: string | null
          quantity: number
          reference?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          reference?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string
          date: string
          hardware_total: number
          id: string
          invoice_number: string
          labor_charges: number
          service_charges: number
          service_job_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          total: number
          updated_at: string
          vat: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          date?: string
          hardware_total?: number
          id?: string
          invoice_number: string
          labor_charges?: number
          service_charges?: number
          service_job_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total?: number
          updated_at?: string
          vat?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          date?: string
          hardware_total?: number
          id?: string
          invoice_number?: string
          labor_charges?: number
          service_charges?: number
          service_job_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total?: number
          updated_at?: string
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_service_job_id_fkey"
            columns: ["service_job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_job_employees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          service_job_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          service_job_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          service_job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_job_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_job_employees_service_job_id_fkey"
            columns: ["service_job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_job_items: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          quantity: number
          service_job_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          quantity?: number
          service_job_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          quantity?: number
          service_job_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_job_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_job_items_service_job_id_fkey"
            columns: ["service_job_id"]
            isOneToOne: false
            referencedRelation: "service_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_jobs: {
        Row: {
          created_at: string
          employee_id: string | null
          end_time: string | null
          id: string
          service_notes: string | null
          service_request_id: string
          start_time: string | null
          status: Database["public"]["Enums"]["service_job_status"]
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          end_time?: string | null
          id?: string
          service_notes?: string | null
          service_request_id: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["service_job_status"]
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          end_time?: string | null
          id?: string
          service_notes?: string | null
          service_request_id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["service_job_status"]
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_jobs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_jobs_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_technician: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          location: string | null
          priority: string
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
        }
        Insert: {
          assigned_technician?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          location?: string | null
          priority?: string
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
        }
        Update: {
          assigned_technician?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          location?: string | null
          priority?: string
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "technician" | "accounts"
      invoice_status: "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled"
      payment_method: "Cash" | "Bank Transfer" | "Credit Card" | "Cheque"
      service_job_status:
        | "Scheduled"
        | "In Progress"
        | "Completed"
        | "Cancelled"
      service_request_status:
        | "Pending"
        | "Assigned"
        | "In Progress"
        | "Completed"
        | "Invoiced"
      transaction_type: "Stock In" | "Stock Out" | "Adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "technician", "accounts"],
      invoice_status: ["Draft", "Pending", "Paid", "Overdue", "Cancelled"],
      payment_method: ["Cash", "Bank Transfer", "Credit Card", "Cheque"],
      service_job_status: [
        "Scheduled",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      service_request_status: [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Invoiced",
      ],
      transaction_type: ["Stock In", "Stock Out", "Adjustment"],
    },
  },
} as const
