import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";
import {
  users, contacts, conversations, messages, notes, organizations, auditLogs,
  type User, type InsertUser, type Contact, type InsertContact,
  type Conversation, type InsertConversation, type Message, type InsertMessage,
  type Note, type InsertNote, type Organization
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  getConversations(): Promise<(Conversation & { contact: Contact })[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversationStatus(id: number, status: string): Promise<Conversation>;
  assignConversation(id: number, userId: number | null): Promise<Conversation>;
  createConversation(convo: InsertConversation): Promise<Conversation>;
  
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContactTags(id: number, tags: string[]): Promise<Contact>;
  
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getNotes(contactId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  
  createAuditLog(log: Omit<typeof auditLogs.$inferInsert, "id" | "createdAt">): Promise<void>;
  initializeOrg(): Promise<Organization>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getConversations(): Promise<(Conversation & { contact: Contact })[]> {
    const results = await db.query.conversations.findMany({
      with: { contact: true },
      orderBy: [desc(conversations.lastMessageAt)]
    });
    return results as (Conversation & { contact: Contact })[];
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [convo] = await db.select().from(conversations).where(eq(conversations.id, id));
    return convo;
  }

  async updateConversationStatus(id: number, status: string): Promise<Conversation> {
    const [convo] = await db.update(conversations).set({ status }).where(eq(conversations.id, id)).returning();
    return convo;
  }

  async assignConversation(id: number, userId: number | null): Promise<Conversation> {
    const [convo] = await db.update(conversations).set({ assignedToUserId: userId }).where(eq(conversations.id, id)).returning();
    return convo;
  }

  async createConversation(insertConvo: InsertConversation): Promise<Conversation> {
    const [convo] = await db.insert(conversations).values(insertConvo).returning();
    return convo;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }

  async updateContactTags(id: number, tags: string[]): Promise<Contact> {
    const [contact] = await db.update(contacts).set({ tags }).where(eq(contacts.id, id)).returning();
    return contact;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(insertMessage).returning();
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, insertMessage.conversationId));
    return msg;
  }

  async getNotes(contactId: number): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.contactId, contactId)).orderBy(desc(notes.createdAt));
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }

  async createAuditLog(log: Omit<typeof auditLogs.$inferInsert, "id" | "createdAt">): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async initializeOrg(): Promise<Organization> {
    let [org] = await db.select().from(organizations);
    if (!org) {
      [org] = await db.insert(organizations).values({ name: "Default Org" }).returning();
    }
    return org;
  }
}

export const storage = new DatabaseStorage();
