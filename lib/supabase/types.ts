export type EstadoCuenta = "pendiente" | "parcial" | "pagada";
export type TipoCobro = "consumo" | "propina";
export type EstadoCobro = "pendiente" | "pagado" | "expirado";

export type Database = {
  public: {
    Tables: {
      negocios: {
        Row: {
          id: string;
          nombre: string;
          pey_bank_account_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          pey_bank_account_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          pey_bank_account_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meseros: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          pey_bank_account_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          pey_bank_account_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          negocio_id?: string;
          nombre?: string;
          pey_bank_account_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cuentas: {
        Row: {
          id: string;
          negocio_id: string;
          mesero_id: string;
          mesa: string;
          estado: EstadoCuenta;
          total_centavos: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          mesero_id: string;
          mesa: string;
          estado?: EstadoCuenta;
          total_centavos: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          negocio_id?: string;
          mesero_id?: string;
          mesa?: string;
          estado?: EstadoCuenta;
          total_centavos?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      partidas: {
        Row: {
          id: string;
          cuenta_id: string;
          descripcion: string;
          cantidad: number;
          precio_centavos: number;
        };
        Insert: {
          id?: string;
          cuenta_id: string;
          descripcion: string;
          cantidad: number;
          precio_centavos: number;
        };
        Update: {
          id?: string;
          cuenta_id?: string;
          descripcion?: string;
          cantidad?: number;
          precio_centavos?: number;
        };
        Relationships: [];
      };
      cobros: {
        Row: {
          id: string;
          cuenta_id: string | null;
          mesero_id: string | null;
          tipo: TipoCobro;
          monto_centavos: number;
          estado: EstadoCobro;
          pey_qr_id: string;
          pey_transaction_id: string | null;
          qr_string: string;
          concepto: string;
          webhook_event_id: string | null;
          created_at: string;
          pagado_at: string | null;
        };
        Insert: {
          id?: string;
          cuenta_id?: string | null;
          mesero_id?: string | null;
          tipo: TipoCobro;
          monto_centavos: number;
          estado?: EstadoCobro;
          pey_qr_id: string;
          pey_transaction_id?: string | null;
          qr_string: string;
          concepto: string;
          webhook_event_id?: string | null;
          created_at?: string;
          pagado_at?: string | null;
        };
        Update: {
          id?: string;
          cuenta_id?: string | null;
          mesero_id?: string | null;
          tipo?: TipoCobro;
          monto_centavos?: number;
          estado?: EstadoCobro;
          pey_qr_id?: string;
          pey_transaction_id?: string | null;
          qr_string?: string;
          concepto?: string;
          webhook_event_id?: string | null;
          created_at?: string;
          pagado_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      sale_insert_cobro: {
        Args: {
          p_cuenta_id: string | null;
          p_mesero_id: string | null;
          p_tipo: TipoCobro;
          p_monto_centavos: number;
          p_pey_qr_id: string;
          p_qr_string: string;
          p_concepto: string;
        };
        Returns: Database["public"]["Tables"]["cobros"]["Row"];
      };
      sale_mark_cobro_pagado: {
        Args: {
          p_pey_qr_id: string;
          p_event_id: string;
          p_transaction_id: string;
          p_pagado_at: string;
        };
        Returns: Array<{
          applied: boolean;
          cobro_id: string;
          cuenta_id: string | null;
          tipo: TipoCobro;
        }>;
      };
      sale_set_cuenta_estado: {
        Args: {
          p_cuenta_id: string;
          p_estado: EstadoCuenta;
        };
        Returns: undefined;
      };
      sale_expire_consumo_pendientes: {
        Args: {
          p_cuenta_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      estado_cuenta: EstadoCuenta;
      tipo_cobro: TipoCobro;
      estado_cobro: EstadoCobro;
    };
    CompositeTypes: Record<string, never>;
  };
};
