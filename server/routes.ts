import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api } from "@shared/routes";
import { WebSocketServer } from "ws";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      // Future WS inbound handlers
    });
  });

  const notifyClients = (type: string, payload: any) => {
    const msg = JSON.stringify({ type, payload });
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(msg);
      }
    });
  };

  // Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };
  
  const requireAdminOrSupervisor = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPERVISOR") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    next();
  };

  // Users
  app.get(api.users.list.path, requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // Conversations
  app.get(api.conversations.list.path, requireAuth, async (req, res) => {
    const convos = await storage.getConversations();
    res.json(convos);
  });

  app.get(api.conversations.get.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const conversation = await storage.getConversation(id);
    if (!conversation) return res.status(404).json({ message: "Not found" });
    
    const contact = await storage.getContact(conversation.contactId);
    if (!contact) return res.status(404).json({ message: "Not found" });
    
    const messages = await storage.getMessages(id);
    const notes = await storage.getNotes(conversation.contactId);
    
    res.json({ conversation, contact, messages, notes });
  });

  app.patch(api.conversations.updateStatus.path, requireAuth, async (req, res) => {
    const { status } = req.body;
    const convo = await storage.updateConversationStatus(Number(req.params.id), status);
    notifyClients('conversation_update', { id: convo.id });
    res.json(convo);
  });

  app.patch(api.conversations.assign.path, requireAuth, async (req, res) => {
    const { userId } = req.body;
    const convo = await storage.assignConversation(Number(req.params.id), userId);
    notifyClients('conversation_update', { id: convo.id });
    res.json(convo);
  });

  app.post(api.conversations.sendMessage.path, requireAuth, async (req, res) => {
    const convoId = Number(req.params.id);
    const body = req.body.body;
    
    const convo = await storage.getConversation(convoId);
    if (!convo) return res.status(404).json({ message: "Not found" });

    const msg = await storage.createMessage({
      organizationId: convo.organizationId,
      conversationId: convoId,
      direction: "OUTBOUND",
      body,
      type: "TEXT",
      status: "SENT",
      sentByUserId: req.user.id
    });
    
    notifyClients('new_message', { conversationId: convoId });
    res.status(201).json(msg);
  });

  // Contacts
  app.post(api.contacts.addNote.path, requireAuth, async (req, res) => {
    const contactId = Number(req.params.id);
    const contact = await storage.getContact(contactId);
    if (!contact) return res.status(404).json({ message: "Not found" });
    
    const note = await storage.createNote({
      organizationId: contact.organizationId,
      contactId,
      createdByUserId: req.user.id,
      body: req.body.body
    });
    
    res.status(201).json(note);
  });

  app.patch(api.contacts.updateTags.path, requireAuth, async (req, res) => {
    const contact = await storage.updateContactTags(Number(req.params.id), req.body.tags);
    res.json(contact);
  });

  // Metrics
  app.get(api.metrics.dashboard.path, requireAdminOrSupervisor, async (req, res) => {
    res.json({
      messagesSentByUser: [
        { name: "Admin User", count: 42 },
        { name: "Agent Juan", count: 85 }
      ],
      avgResponseTime: 4.5, // minutes
      conversationsClosedByUser: [
        { name: "Admin User", count: 12 },
        { name: "Agent Juan", count: 35 }
      ]
    });
  });

  // Seed DB with mock data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const org = await storage.initializeOrg();
  const usersList = await storage.getUsers();
  
  if (usersList.length === 0) {
    const adminPass = await hashPassword("admin123");
    const agentPass = await hashPassword("agent123");
    
    const admin = await storage.createUser({
      organizationId: org.id,
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminPass,
      role: "ADMIN",
      status: "ACTIVE"
    });
    
    const agent = await storage.createUser({
      organizationId: org.id,
      name: "Agent Juan",
      email: "agent@example.com",
      passwordHash: agentPass,
      role: "AGENT",
      status: "ACTIVE"
    });

    const contact = await storage.createContact({
      organizationId: org.id,
      waId: "5215551234567",
      name: "Cliente VIP",
      email: "cliente@vip.com",
      tags: ["VIP", "Nuevo"]
    });

    const convo = await storage.createConversation({
      organizationId: org.id,
      contactId: contact.id,
      status: "OPEN",
      assignedToUserId: null
    });

    await storage.createMessage({
      organizationId: org.id,
      conversationId: convo.id,
      direction: "INBOUND",
      body: "Hola, me interesa su producto. ¿Tienen disponibilidad?",
      type: "TEXT",
      status: "DELIVERED"
    });

    await storage.createMessage({
      organizationId: org.id,
      conversationId: convo.id,
      direction: "OUTBOUND",
      body: "¡Hola! Sí, tenemos disponibilidad. ¿Cuántas unidades buscas?",
      type: "TEXT",
      status: "SENT",
      sentByUserId: admin.id
    });
  }
}
