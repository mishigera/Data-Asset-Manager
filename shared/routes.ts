import { z } from 'zod';
import { 
  insertUserSchema, 
  users, contacts, conversations, messages, notes 
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          contact: z.custom<typeof contacts.$inferSelect>(),
          status: z.string(),
          assignedToUserId: z.number().nullable(),
          lastMessageAt: z.union([z.string(), z.date()]).nullable()
        }))
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/conversations/:id' as const,
      responses: {
        200: z.object({
          conversation: z.custom<typeof conversations.$inferSelect>(),
          contact: z.custom<typeof contacts.$inferSelect>(),
          messages: z.array(z.custom<typeof messages.$inferSelect>()),
          notes: z.array(z.custom<typeof notes.$inferSelect>())
        }),
        404: errorSchemas.notFound,
      }
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/conversations/:id/status' as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof conversations.$inferSelect>(),
      }
    },
    assign: {
      method: 'PATCH' as const,
      path: '/api/conversations/:id/assign' as const,
      input: z.object({ userId: z.number().nullable() }),
      responses: {
        200: z.custom<typeof conversations.$inferSelect>(),
      }
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages' as const,
      input: z.object({ body: z.string() }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
      }
    }
  },
  contacts: {
    addNote: {
      method: 'POST' as const,
      path: '/api/contacts/:id/notes' as const,
      input: z.object({ body: z.string() }),
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
      }
    },
    updateTags: {
      method: 'PATCH' as const,
      path: '/api/contacts/:id/tags' as const,
      input: z.object({ tags: z.array(z.string()) }),
      responses: {
        200: z.custom<typeof contacts.$inferSelect>(),
      }
    }
  },
  metrics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/metrics/dashboard' as const,
      responses: {
        200: z.object({
          messagesSentByUser: z.array(z.object({ name: z.string(), count: z.number() })),
          avgResponseTime: z.number(),
          conversationsClosedByUser: z.array(z.object({ name: z.string(), count: z.number() }))
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
