export type MeseroPublico = {
  id: string;
  nombre: string;
  tieneCuenta: boolean;
  rol: "mesero" | "admin";
  activo: boolean;
  tienePin: boolean;
};
