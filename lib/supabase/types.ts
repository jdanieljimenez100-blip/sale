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
    Functions: Record<string, never>;
    Enums: {
      estado_cuenta: EstadoCuenta;
      tipo_cobro: TipoCobro;
      estado_cobro: EstadoCobro;
    };
    CompositeTypes: Record<string, never>;
  };
};
