export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          role?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      flash_offers: {
        Row: {
          created_at: string | null
          current_purchases: number | null
          description: string | null
          discount_percentage: number
          end_time: string
          id: string
          is_active: boolean | null
          max_purchases: number | null
          offer_price: number
          original_price: number
          product_id: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          current_purchases?: number | null
          description?: string | null
          discount_percentage?: number
          end_time: string
          id?: string
          is_active?: boolean | null
          max_purchases?: number | null
          offer_price: number
          original_price: number
          product_id: string
          start_time?: string
          title: string
        }
        Update: {
          created_at?: string | null
          current_purchases?: number | null
          description?: string | null
          discount_percentage?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_purchases?: number | null
          offer_price?: number
          original_price?: number
          product_id?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          payment_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          session_id: string | null
          shipping_address: Json | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          session_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          session_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          delivery_method: string | null
          email: string
          google_drive_link: string | null
          id: string
          mobile_number: string | null
          payment_method: string | null
          payment_proof_url: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          transaction_id: string | null
          upi_reference_id: string | null
          user_id: string | null
          verified_at: string | null
          whatsapp_sent: boolean | null
          whatsapp_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          delivery_method?: string | null
          email: string
          google_drive_link?: string | null
          id?: string
          mobile_number?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          transaction_id?: string | null
          upi_reference_id?: string | null
          user_id?: string | null
          verified_at?: string | null
          whatsapp_sent?: boolean | null
          whatsapp_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          delivery_method?: string | null
          email?: string
          google_drive_link?: string | null
          id?: string
          mobile_number?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          transaction_id?: string | null
          upi_reference_id?: string | null
          user_id?: string | null
          verified_at?: string | null
          whatsapp_sent?: boolean | null
          whatsapp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_analytics: {
        Row: {
          current_viewers: number | null
          id: string
          last_updated: string | null
          product_id: string
          total_purchases: number | null
        }
        Insert: {
          current_viewers?: number | null
          id?: string
          last_updated?: string | null
          product_id: string
          total_purchases?: number | null
        }
        Update: {
          current_viewers?: number | null
          id?: string
          last_updated?: string | null
          product_id?: string
          total_purchases?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          download_link: string | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_flash_offer: boolean | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          razorpay_link: string | null
          review_count: number | null
          stock_quantity: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          download_link?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_flash_offer?: boolean | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          razorpay_link?: string | null
          review_count?: number | null
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          download_link?: string | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_flash_offer?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          razorpay_link?: string | null
          review_count?: number | null
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_access: {
        Row: {
          accessed_at: string | null
          created_at: string | null
          id: string
          payment_id: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_access_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          ip_address: string | null
          session_start: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          session_start?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          session_start?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_verified: boolean | null
          last_login: string | null
          last_visit: string | null
          login_streak: number | null
          mobile_number: string
          name: string
          razorpay_payment_id: string | null
          updated_at: string
          visit_count: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          last_visit?: string | null
          login_streak?: number | null
          mobile_number: string
          name: string
          razorpay_payment_id?: string | null
          updated_at?: string
          visit_count?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          last_visit?: string | null
          login_streak?: number | null
          mobile_number?: string
          name?: string
          razorpay_payment_id?: string | null
          updated_at?: string
          visit_count?: number | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed_at: string | null
          signature: string | null
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed_at?: string | null
          signature?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          signature?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      payment_status_summary: {
        Row: {
          count: number | null
          earliest_payment: string | null
          latest_payment: string | null
          payment_method: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_verify_razorpay_payments: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_verification_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_payments: number
          completed_payments: number
          pending_manual: number
          auto_verified_today: number
          total_revenue: number
        }[]
      }
      increment_product_purchase: {
        Args: { product_uuid: string }
        Returns: undefined
      }
      update_product_viewers: {
        Args: { product_uuid: string; viewer_change: number }
        Returns: undefined
      }
      verify_user_access: {
        Args: { user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
