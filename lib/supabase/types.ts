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
          propina_porcentajes: number[];
          reparto_cocina_pct: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          pey_bank_account_id?: string | null;
          propina_porcentajes?: number[];
          reparto_cocina_pct?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          pey_bank_account_id?: string | null;
          propina_porcentajes?: number[];
          reparto_cocina_pct?: number;
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
          rol: "mesero" | "admin";
          pin_hash: string | null;
          pin_intentos_fallidos: number;
          pin_bloqueado_hasta: string | null;
          activo: boolean;
          sesion_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          pey_bank_account_id?: string | null;
          rol?: "mesero" | "admin";
          pin_hash?: string | null;
          pin_intentos_fallidos?: number;
          pin_bloqueado_hasta?: string | null;
          activo?: boolean;
          sesion_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          negocio_id?: string;
          nombre?: string;
          pey_bank_account_id?: string | null;
          rol?: "mesero" | "admin";
          pin_hash?: string | null;
          pin_intentos_fallidos?: number;
          pin_bloqueado_hasta?: string | null;
          activo?: boolean;
          sesion_version?: number;
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
          cerrada_at: string | null;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          mesero_id: string;
          mesa: string;
          estado?: EstadoCuenta;
          total_centavos: number;
          created_at?: string;
          cerrada_at?: string | null;
        };
        Update: {
          id?: string;
          negocio_id?: string;
          mesero_id?: string;
          mesa?: string;
          estado?: EstadoCuenta;
          total_centavos?: number;
          created_at?: string;
          cerrada_at?: string | null;
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
          notas: string | null;
          menu_item_id: string | null;
        };
        Insert: {
          id?: string;
          cuenta_id: string;
          descripcion: string;
          cantidad: number;
          precio_centavos: number;
          notas?: string | null;
          menu_item_id?: string | null;
        };
        Update: {
          id?: string;
          cuenta_id?: string;
          descripcion?: string;
          cantidad?: number;
          precio_centavos?: number;
          notas?: string | null;
          menu_item_id?: string | null;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          categoria: string;
          precio_centavos: number;
          activo: boolean;
          orden: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          categoria: string;
          precio_centavos: number;
          activo?: boolean;
          orden?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          negocio_id?: string;
          nombre?: string;
          categoria?: string;
          precio_centavos?: number;
          activo?: boolean;
          orden?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      bitacora: {
        Row: {
          id: string;
          mesero_id: string | null;
          accion: string;
          detalle: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          mesero_id?: string | null;
          accion: string;
          detalle?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          mesero_id?: string | null;
          accion?: string;
          detalle?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      resenas: {
        Row: {
          id: string;
          cobro_id: string;
          mesero_id: string;
          cuenta_id: string | null;
          estrellas: number;
          comentario: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cobro_id: string;
          mesero_id: string;
          cuenta_id?: string | null;
          estrellas: number;
          comentario?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cobro_id?: string;
          mesero_id?: string;
          cuenta_id?: string | null;
          estrellas?: number;
          comentario?: string | null;
          created_at?: string;
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
          cobro_origen_id: string | null;
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
          cobro_origen_id?: string | null;
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
          cobro_origen_id?: string | null;
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
          p_cobro_origen_id?: string | null;
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
      sale_abrir_cuenta: {
        Args: {
          p_negocio_id: string;
          p_mesero_id: string;
          p_mesa: string;
        };
        Returns: Database["public"]["Tables"]["cuentas"]["Row"];
      };
      sale_agregar_partida: {
        Args: {
          p_cuenta_id: string;
          p_descripcion: string;
          p_cantidad: number;
          p_precio_centavos: number;
          p_notas?: string | null;
          p_menu_item_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["cuentas"]["Row"];
      };
      sale_quitar_partida: {
        Args: {
          p_partida_id: string;
        };
        Returns: Database["public"]["Tables"]["cuentas"]["Row"];
      };
      sale_cerrar_cuenta: {
        Args: {
          p_cuenta_id: string;
        };
        Returns: Database["public"]["Tables"]["cuentas"]["Row"];
      };
      sale_pin_reservar_intento: {
        Args: {
          p_mesero_id: string;
        };
        Returns: string;
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
