import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  usuario: varchar("usuario", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  empresa: varchar("empresa", { length: 150 }).notNull(),
  logoUrl: text("logo_url"),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  gp: decimal("gp", { precision: 5, scale: 4 }).notNull().default("0.15"),
  gpQnap: decimal("gp_qnap", { precision: 5, scale: 4 }).notNull().default("0.15"),
  gpAxis: decimal("gp_axis", { precision: 5, scale: 4 }).notNull().default("0.15"),
  partnerCategory: varchar("partner_category", { length: 50 })
    .notNull()
    .default("Partner Autorizado"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  origen: varchar("origen", { length: 50 }).notNull().default("QNAP"),
  marca: varchar("marca", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  mpn: varchar("mpn", { length: 100 }).notNull(),
  descripcion: text("descripcion").notNull(),
  precioDisty: decimal("precio_disty", { precision: 12, scale: 2 }).notNull().default("0"),
  gp: decimal("gp", { precision: 5, scale: 4 }).notNull().default("0.15"),
  rebatePartnerAutorizado: decimal("rebate_partner_autorizado", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  rebatePartnerSilver: decimal("rebate_partner_silver", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  rebatePartnerGold: decimal("rebate_partner_gold", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  rebatePartnerMultiregional: decimal("rebate_partner_multiregional", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  tiempoEntrega: varchar("tiempo_entrega", { length: 200 })
    .notNull()
    .default("ETA por confirmar"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cotizaciones = pgTable("cotizaciones", {
  id: serial("id").primaryKey(),
  clienteNombre: varchar("cliente_nombre", { length: 100 }).notNull(),
  clienteEmpresa: varchar("cliente_empresa", { length: 100 }).notNull(),
  clienteEmail: varchar("cliente_email", { length: 100 }).notNull(),
  clienteTelefono: varchar("cliente_telefono", { length: 50 }),
  pid: varchar("pid", { length: 100 }),
  proyecto: varchar("proyecto", { length: 200 }).notNull(),
  clienteFinal: varchar("cliente_final", { length: 150 }),
  fechaEjecucion: date("fecha_ejecucion"),
  fechaImplementacion: date("fecha_implementacion"),
  vms: varchar("vms", { length: 100 }),
  total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"),
  estado: varchar("estado", { length: 20 }).notNull().default("revision"),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id),
  usuario: varchar("usuario", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cotizacionItems = pgTable("cotizacion_items", {
  id: serial("id").primaryKey(),
  cotizacionId: integer("cotizacion_id")
    .notNull()
    .references(() => cotizaciones.id, { onDelete: "cascade" }),
  productoId: integer("producto_id").references(() => productos.id),
  marca: varchar("marca", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  mpn: varchar("mpn", { length: 100 }).notNull(),
  descripcion: text("descripcion").notNull(),
  precioDisty: decimal("precio_disty", { precision: 12, scale: 2 }).notNull(),
  gp: decimal("gp", { precision: 5, scale: 4 }).notNull(),
  cantidad: integer("cantidad").notNull().default(1),
  precioUnitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  precioTotal: decimal("precio_total", { precision: 12, scale: 2 }).notNull(),
  tiempoEntrega: varchar("tiempo_entrega", { length: 200 }),
});

export const sesiones = pgTable(
  "sesiones",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 120 }).notNull(),
    deviceId: varchar("device_id", { length: 120 }),
    ipAddress: varchar("ip_address", { length: 80 }),
    userAgent: text("user_agent"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    lastSeen: timestamp("last_seen").notNull().defaultNow(),
    revoked: boolean("revoked").notNull().default(false),
  },
  (table) => ({
    userSessionUniqueIdx: uniqueIndex("sesiones_user_session_unique_idx").on(
      table.userId,
      table.sessionId,
    ),
    userRevokedLastSeenIdx: index("sesiones_user_revoked_last_seen_idx").on(
      table.userId,
      table.revoked,
      table.lastSeen,
    ),
  }),
);

export const loginLogs = pgTable(
  "login_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => usuarios.id, { onDelete: "set null" }),
    usuario: varchar("usuario", { length: 50 }).notNull(),
    success: boolean("success").notNull(),
    ipAddress: varchar("ip_address", { length: 80 }),
    userAgent: text("user_agent"),
    deviceId: varchar("device_id", { length: 120 }),
    sessionId: varchar("session_id", { length: 120 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("login_logs_user_created_at_idx").on(table.userId, table.createdAt),
    usuarioCreatedAtIdx: index("login_logs_usuario_created_at_idx").on(
      table.usuario,
      table.createdAt,
    ),
    ipCreatedAtIdx: index("login_logs_ip_created_at_idx").on(table.ipAddress, table.createdAt),
  }),
);

export const boMeta = pgTable("bo_meta", {
  id: serial("id").primaryKey(),
  bo: varchar("bo", { length: 100 }).notNull().unique(),
  projectName: text("project_name"),
  poAxis: text("po_axis"),
  estimatedInvoiceDate: date("estimated_invoice_date"),
  estimatedInvoiceMonth: varchar("estimated_invoice_month", { length: 7 }),
  estimatedInvoiceWeek: smallint("estimated_invoice_week"),
  sAndDStatus: varchar("s_and_d_status", { length: 20 }),
  invoiced: boolean("invoiced").notNull().default(false),
  invoicedAt: timestamp("invoiced_at"),
  customerName: text("customer_name"),
  allocPct: decimal("alloc_pct", { precision: 12, scale: 4 }),
  customerPo: text("customer_po"),
  lastSeenAt: timestamp("last_seen_at"),
  purchaseStatus: varchar("purchase_status", { length: 20 }),
  purchaseDispatch: varchar("purchase_dispatch", { length: 20 }),
  purchaseShipping: varchar("purchase_shipping", { length: 20 }),
  purchaseSo: text("purchase_so"),
  deleted: boolean("deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  deletedComment: text("deleted_comment"),
  deletedBy: integer("deleted_by").references(() => usuarios.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const boLineMeta = pgTable(
  "bo_line_meta",
  {
    id: serial("id").primaryKey(),
    bo: varchar("bo", { length: 100 }).notNull(),
    sku: text("sku").notNull(),
    mpn: text("mpn").notNull(),
    montoAxis: decimal("monto_axis", { precision: 14, scale: 4 }),
    montoIntcomex: decimal("monto_intcomex", { precision: 14, scale: 4 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    boSkuMpnUniqueIdx: uniqueIndex("bo_line_meta_bo_sku_mpn_unique_idx").on(
      table.bo,
      table.sku,
      table.mpn,
    ),
  }),
);

export const boDeletedLogs = pgTable("bo_deleted_logs", {
  id: serial("id").primaryKey(),
  bo: varchar("bo", { length: 100 }).notNull(),
  deletedBy: integer("deleted_by").references(() => usuarios.id),
  deletedByUsuario: varchar("deleted_by_usuario", { length: 50 }),
  comment: text("comment"),
  snapshot: jsonb("snapshot"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  cotizaciones: many(cotizaciones),
  sesiones: many(sesiones),
  loginLogs: many(loginLogs),
}));

export const cotizacionesRelations = relations(cotizaciones, ({ one, many }) => ({
  usuario: one(usuarios, {
    fields: [cotizaciones.usuarioId],
    references: [usuarios.id],
  }),
  items: many(cotizacionItems),
}));

export const cotizacionItemsRelations = relations(cotizacionItems, ({ one }) => ({
  cotizacion: one(cotizaciones, {
    fields: [cotizacionItems.cotizacionId],
    references: [cotizaciones.id],
  }),
  producto: one(productos, {
    fields: [cotizacionItems.productoId],
    references: [productos.id],
  }),
}));

export const schema = {
  usuarios,
  productos,
  cotizaciones,
  cotizacionItems,
  sesiones,
  loginLogs,
  boMeta,
  boLineMeta,
  boDeletedLogs,
};
