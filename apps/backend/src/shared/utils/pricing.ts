export const QNAP_CONSTANTS = {
  INBOUND_FREIGHT: 1.011,
  IC: 0.95,
  INT: 0.12,
} as const;

export const AXIS_CONSTANTS = {
  INBOUND_FREIGHT: 1.015,
  IC: 0.97,
  INT: 0.12,
} as const;

type AxisProducto = {
  rebatePartnerAutorizado: number | string;
  rebatePartnerSilver: number | string;
  rebatePartnerGold: number | string;
  rebatePartnerMultiregional: number | string;
};

type CalcularPrecioClienteArgs = {
  origen: string;
  precioDisty: number | string;
  gp?: number | string;
  producto?: AxisProducto | null;
  partnerCategory?: string | null;
  projectRebate?: number | string;
};

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calcularPrecioQnap(precioDisty: number | string, gp = 0.15): number {
  if (gp >= 1) {
    throw new Error("gp debe ser menor a 1");
  }

  const costoXUS = toNumber(precioDisty) * QNAP_CONSTANTS.INBOUND_FREIGHT;
  const costoFinalXUS = costoXUS / QNAP_CONSTANTS.IC;
  const costoXCL = costoFinalXUS * (1 + QNAP_CONSTANTS.INT);

  return costoXCL / (1 - gp);
}

export function calcularPrecioAxis(
  precioDisty: number | string,
  gp = 0.15,
  partnerRebate = 0,
  projectRebate = 0,
): number {
  if (gp >= 1) {
    throw new Error("gp debe ser menor a 1");
  }

  const costoXUS = toNumber(precioDisty) * AXIS_CONSTANTS.INBOUND_FREIGHT;
  const costoFinalXUS = costoXUS / AXIS_CONSTANTS.IC;
  const costoXCL = costoFinalXUS * (1 + AXIS_CONSTANTS.INT);
  const rebateTotal = toNumber(partnerRebate) + toNumber(projectRebate);
  const costoFinalXCL = Math.max(costoXCL - rebateTotal, 0);

  return costoFinalXCL / (1 - gp);
}

export function getAxisPartnerRebate(
  producto: AxisProducto,
  partnerCategory?: string | null,
): number {
  switch (partnerCategory) {
    case "Partner Silver":
      return toNumber(producto.rebatePartnerSilver);
    case "Partner Gold":
      return toNumber(producto.rebatePartnerGold);
    case "Partner Multiregional":
      return toNumber(producto.rebatePartnerMultiregional);
    default:
      return toNumber(producto.rebatePartnerAutorizado);
  }
}

export function calcularPrecioCliente({
  origen,
  precioDisty,
  gp = 0.15,
  producto,
  partnerCategory,
  projectRebate = 0,
}: CalcularPrecioClienteArgs): number {
  const parsedGp = toNumber(gp, 0.15);

  if (origen === "AXIS" && producto) {
    return calcularPrecioAxis(
      precioDisty,
      parsedGp,
      getAxisPartnerRebate(producto, partnerCategory),
      toNumber(projectRebate),
    );
  }

  return calcularPrecioQnap(precioDisty, parsedGp);
}

export function parseGp(value: number | string | null | undefined, fallback = 0.15): number {
  const parsed = toNumber(value, fallback);

  if (parsed > 1) {
    return parsed / 100;
  }

  return parsed;
}
