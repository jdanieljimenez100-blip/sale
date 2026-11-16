export type SeccionAyuda = {
  titulo: string;
  parrafos: string[];
  pasos?: string[];
};

export type TemaAyuda = {
  slug: string;
  titulo: string;
  resumen: string;
  secciones: SeccionAyuda[];
};

/**
 * Temas de ayuda públicos. Lenguaje simple (MX).
 * Sin llaves, ULID, CLABE ni PIN reales.
 */
export const TEMAS_AYUDA: TemaAyuda[] = [
  {
    slug: "como-funciona",
    titulo: "Cómo funciona Sale",
    resumen:
      "De abrir la mesa al ticket del cliente, pasando por el cobro CoDi.",
    secciones: [
      {
        titulo: "El recorrido completo",
        parrafos: [
          "Sale es el punto de venta del restaurante. El mesero arma la cuenta, el cliente paga con CoDi desde su banco y solo entonces la mesa queda pagada.",
          "El estado “pagado” no lo marca nadie a mano en la pantalla: lo confirma el banco con un aviso firmado a nuestros servidores.",
        ],
        pasos: [
          "Abres una mesa y queda a tu nombre.",
          "Agregas platillos del menú (puedes poner una nota corta, sin datos personales).",
          "Cobras: Sale muestra un QR CoDi con el monto.",
          "El cliente escanea con la app de su banco y confirma el pago.",
          "El banco avisa a Sale con un webhook firmado; la mesa pasa a pagada.",
          "El cliente puede escanear su ticket (enlace o QR) para ver el detalle y guardarlo.",
        ],
      },
      {
        titulo: "Qué verás en el salón",
        parrafos: [
          "En Mesas ves qué cuentas están pendientes, parciales o pagadas. Cuando una mesa ya está pagada, puedes cerrarla para liberar el número.",
          "Si el QR se vence antes de que paguen, genera otro desde la pantalla del cobro. No inventes un “pagado” a mano.",
        ],
      },
    ],
  },
  {
    slug: "conectar-pey",
    titulo: "Conectar pey (CoDi)",
    resumen:
      "Pega la API key en Ajustes → Restaurante, copia tu URL de webhook al portal de pey y prueba con un centavo.",
    secciones: [
      {
        titulo: "Antes de empezar",
        parrafos: [
          "pey genera los QR CoDi y avisa cuando un pago quedó hecho. Cada restaurante guarda su propia API key y secreto del webhook cifrados en Sale (Ajustes → Restaurante). Nunca van al navegador completos ni se comparten por chat.",
        ],
      },
      {
        titulo: "Pasos en portal.mipey.mx y en Sale",
        parrafos: [
          "Hazlo una vez por restaurante. Si cambias de llave, también cambia el secreto del webhook.",
        ],
        pasos: [
          "Crea tu cuenta en portal.mipey.mx.",
          "En “Desarrollador”, crea UNA API key por restaurante.",
          "En Sale ve a Ajustes → Restaurante, copia la URL del webhook de ese restaurante y pégala en el portal de pey, en el webhook de ESTA API key. Guarda el secreto que pey te muestra.",
          "Pega la API key y el secreto del webhook en Ajustes → Restaurante (solo admin). Sale los guarda cifrados; después solo verás los últimos 4 de la key.",
          "Registra las cuentas bancarias (CLABE) del restaurante y de los meseros bajo esa misma API key. En Sale pega el id de cuenta (ULID) y toca Verificar; no se guarda la CLABE.",
          "La activación CoDi puede tardar hasta 5 días hábiles (el estado pasa de PENDING a ACTIVE).",
          "Prueba con un cobro de un centavo ($0.01) para confirmar que el webhook llega y la mesa se marca pagada.",
        ],
      },
      {
        titulo: "Seguridad de la API key",
        parrafos: [
          "La API key y el secreto del webhook se guardan cifrados por restaurante en Ajustes → Restaurante. Nunca van a una página pública.",
          "Si sospechas que se filtraron, rota la key y el secreto en pey y vuelve a pegarlos en Ajustes → Restaurante.",
        ],
      },
    ],
  },
  {
    slug: "varios-restaurantes",
    titulo: "Varios restaurantes",
    resumen:
      "Crea sucursales, cámbialas en la sesión y arma dispositivos con /entrar?r=.",
    secciones: [
      {
        titulo: "Crear otra sucursal",
        parrafos: [
          "En Ajustes → Restaurantes (solo admin) toca “Nuevo restaurante”, escribe nombre y código (slug). Sale te da acceso de admin a esa sucursal y te pregunta si quieres cambiar a ella.",
        ],
      },
      {
        titulo: "Cambiar de sucursal",
        parrafos: [
          "Si tienes acceso a dos o más, en la cabecera aparece “Sucursal” para cambiar sin cerrar sesión. También puedes usar “Cambiar a este” en Ajustes → Restaurantes.",
          "Al cambiar, ves solo las mesas, cobros y menú de esa sucursal.",
        ],
      },
      {
        titulo: "Dispositivos del salón",
        parrafos: [
          "Cada sucursal tiene su enlace /entrar?r=codigo. En Ajustes → Restaurante puedes copiarlo o mostrar el QR para tabletas y celulares del salón.",
          "Si entras sin código y hay más de un restaurante, Sale te pide el código; no lista los nombres por privacidad.",
        ],
      },
    ],
  },
  {
    slug: "propinas",
    titulo: "Propinas",
    resumen:
      "Segundo QR después del pago, porcentaje sobre esa parte y destino al mesero o al restaurante.",
    secciones: [
      {
        titulo: "Cómo se ofrece la propina",
        parrafos: [
          "La propina es un segundo QR, después de que el consumo (o la parte) ya quedó pagada. No es un campo libre al abrir la mesa.",
          "El porcentaje se calcula sobre ESE pago concreto, no sobre el total de toda la mesa si hubo varias partes.",
        ],
      },
      {
        titulo: "Cuenta dividida",
        parrafos: [
          "Si dividiste la cuenta, cada persona ve su propio flujo: paga su parte y luego decide si deja propina sobre su monto.",
          "Solo puede haber una propina activa por cada pago de consumo. Si el QR de propina vence, se puede generar otro según las reglas de la app.",
        ],
      },
      {
        titulo: "¿A quién llega el dinero?",
        parrafos: [
          "Si el mesero tiene cuenta pey activa, la propina va directo a esa cuenta. Si no, va a la cuenta del restaurante.",
          "El “reparto a cocina” que configura el admin es solo informativo: Sale no mueve ese dinero; el restaurante lo reparte por su cuenta.",
        ],
      },
    ],
  },
  {
    slug: "dividir-cuenta",
    titulo: "Dividir la cuenta",
    resumen:
      "Partes iguales o por montos, siempre cubriendo exactamente lo que falta por cobrar.",
    secciones: [
      {
        titulo: "Partes iguales",
        parrafos: [
          "Eliges cuántas personas y Sale reparte el restante en partes lo más parecidas posible.",
          "Si el total no se divide exacto en centavos, el centavo que sobra va en la primera parte.",
        ],
      },
      {
        titulo: "Por montos",
        parrafos: [
          "Escribes montos en centavos (o pesos en la pantalla) que sumen exactamente lo que aún falta por cobrar de consumo.",
          "Cada monto genera su propio QR. Cuando todos esos cobros queden pagados, la mesa puede pasar a pagada.",
        ],
      },
      {
        titulo: "Consejo en servicio",
        parrafos: [
          "Si alguien ya pagó una parte y quieres regenerar otro QR, usa las pantallas de cobro: no marques nada como pagado a mano.",
        ],
      },
    ],
  },
  {
    slug: "seguridad",
    titulo: "Seguridad",
    resumen:
      "Pagado solo por el banco, un restaurante a la vez, PIN y privacidad.",
    secciones: [
      {
        titulo: "Pagado de verdad",
        parrafos: [
          "El estado “pagado” solo cambia cuando llega un webhook firmado de pey/el banco. Un toque en la pantalla no alcanza.",
          "Si el mismo aviso llega dos veces, Sale lo cuenta una sola vez (idempotencia por id del evento).",
        ],
      },
      {
        titulo: "Tu restaurante, tus datos",
        parrafos: [
          "Cada restaurante solo ve sus mesas, cobros, menú, meseros y reportes. No se mezclan con los de otro local.",
          "Entras con el enlace de tu restaurante (o el que ya guardó este dispositivo). Si atiendes más de un local con acceso de admin, puedes cambiar de restaurante sin mezclar la información.",
        ],
      },
      {
        titulo: "PIN y sesiones",
        parrafos: [
          "Cada mesero y cada admin tiene su propio PIN. Tras varios intentos fallidos, hay un bloqueo de unos minutos.",
          "Si el admin cambia el PIN, el rol o desactiva a alguien, las sesiones viejas dejan de servir.",
        ],
      },
      {
        titulo: "Privacidad",
        parrafos: [
          "Sale no guarda la CLABE ni el nombre de la cuenta del cliente. El ticket público no lleva datos del comensal.",
          "Puedes leer el aviso en /privacidad.",
        ],
      },
    ],
  },
  {
    slug: "reportes",
    titulo: "Reportes a Excel y PDF",
    resumen:
      "Cómo descargar el desempeño en Excel y guardar o imprimir el PDF.",
    secciones: [
      {
        titulo: "Descargar Excel",
        parrafos: [
          "En Reporte elige el periodo (hoy, 7 o 30 días) y toca “Descargar Excel” para el resumen por mesero, o “Excel de pagos” para el detalle de cada cobro pagado.",
          "El archivo abre en Excel u hojas de cálculo. Los montos van en pesos con dos decimales, listos para sumar.",
        ],
      },
      {
        titulo: "Guardar PDF",
        parrafos: [
          "Toca “Guardar PDF” para ver la versión lista para imprimir. Desde ahí usa “Guardar PDF / Imprimir” y elige guardar como PDF o la impresora.",
        ],
      },
      {
        titulo: "Qué ve cada rol",
        parrafos: [
          "El admin ve a todo el equipo y el total del periodo. El mesero solo ve sus propios números y pagos: no aparecen los de otras personas.",
        ],
      },
    ],
  },
  {
    slug: "problemas-frecuentes",
    titulo: "Problemas frecuentes",
    resumen:
      "PIN bloqueado, QR vencido, pago que no se ve y mesa que no cierra.",
    secciones: [
      {
        titulo: "PIN bloqueado",
        parrafos: [
          "Si fallaste varias veces, espera el bloqueo (alrededor de 5 minutos) y vuelve a intentar. Si urge, un admin puede reiniciar el PIN en Equipo.",
        ],
      },
      {
        titulo: "El QR se venció",
        parrafos: [
          "Usa el botón para generar otro QR en la pantalla del cobro. No cobres de nuevo “por si acaso” si el cliente dice que ya pagó: espera unos segundos a que llegue el aviso del banco.",
        ],
      },
      {
        titulo: "Pagué y no se refleja",
        parrafos: [
          "Confirma en la app del banco. Espera unos segundos: el webhook puede tardar un poco. No generes otro cobro del mismo monto hasta estar seguro de que el primero falló.",
          "Si sigue sin aparecer, revisa con el admin que el webhook de pey apunte a la URL de tu restaurante (la de Ajustes) y que la cuenta CoDi esté ACTIVE.",
        ],
      },
      {
        titulo: "La mesa no se cierra",
        parrafos: [
          "Solo se cierra una mesa en estado pagada. Si falta cubrir el total de consumo, cobra o regenera el QR de lo que falta.",
        ],
      },
      {
        titulo: "Cuenta pey en PENDING",
        parrafos: [
          "Mientras la cuenta CoDi no esté ACTIVE (puede tardar días hábiles), los cobros o propinas a esa cuenta pueden fallar o no aplicarse. Usa una cuenta ya activa o espera la activación.",
        ],
      },
    ],
  },
];

export function obtenerTema(slug: string): TemaAyuda | undefined {
  return TEMAS_AYUDA.find((t) => t.slug === slug);
}

export function indiceTema(slug: string): number {
  return TEMAS_AYUDA.findIndex((t) => t.slug === slug);
}
