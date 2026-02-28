import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Entities
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("AGENT"), // ADMIN, SUPERVISOR, AGENT, READONLY
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, DISABLED
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappAccounts = pgTable("whatsapp_accounts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  phoneNumberId: text("phone_number_id").notNull(),
  displayNumber: text("display_number").notNull(),
  token: text("token").notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  waId: text("wa_id").notNull(), // phone number
  name: text("name").notNull(),
  email: text("email"),
  tags: jsonb("tags").default([]), // array of strings
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  contactId: integer("contact_id").notNull(),
  status: text("status").notNull().default("OPEN"), // OPEN, PENDING, CLOSED
  assignedToUserId: integer("assigned_to_user_id"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  conversationId: integer("conversation_id").notNull(),
  direction: text("direction").notNull(), // INBOUND, OUTBOUND
  body: text("body").notNull(),
  type: text("type").notNull().default("TEXT"),
  waMessageId: text("wa_message_id"),
  status: text("status").notNull().default("SENT"), // SENT, DELIVERED, READ, FAILED
  sentByUserId: integer("sent_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  contactId: integer("contact_id").notNull(),
  createdByUserId: integer("created_by_user_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [conversations.contactId],
    references: [contacts.id],
  }),
  assignedUser: one(users, {
    fields: [conversations.assignedToUserId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.sentByUserId],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  conversations: many(conversations),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  contact: one(contacts, {
    fields: [notes.contactId],
    references: [contacts.id],
  }),
  creator: one(users, {
    fields: [notes.createdByUserId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// Types
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type WhatsAppAccount = typeof whatsappAccounts.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type CreateMessageRequest = { body: string };
export type AssignConversationRequest = { userId: number | null };
export type UpdateConversationStatusRequest = { status: string };

// Ws Message Type
export const WS_EVENTS = {
  CONVERSATION_UPDATE: 'conversation_update',
  NEW_MESSAGE: 'new_message',
  PRESENCE_UPDATE: 'presence_update',
} as const;

export interface WsMessage<T = unknown> {
  type: keyof typeof WS_EVENTS;
  payload: T;
}
