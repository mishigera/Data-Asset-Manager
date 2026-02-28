import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useConversations() {
  return useQuery({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path, { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
    retry: false,
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: [api.conversations.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch conversation details");
      return api.conversations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: 3000, // Faster polling for active chat
  });
}

export function useSendMessage(conversationId: number | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.conversations.sendMessage.input>) => {
      if (!conversationId) throw new Error("No conversation selected");
      const url = buildUrl(api.conversations.sendMessage.path, { id: conversationId });
      const res = await fetch(url, {
        method: api.conversations.sendMessage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.conversations.sendMessage.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path, conversationId] });
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const url = buildUrl(api.conversations.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.conversations.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.conversations.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      toast({ title: "Status Updated", description: "Conversation status changed." });
    }
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: number, userId: number | null }) => {
      const url = buildUrl(api.conversations.assign.path, { id });
      const res = await fetch(url, {
        method: api.conversations.assign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to assign conversation");
      return api.conversations.assign.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      toast({ title: "Assigned", description: "Conversation assignment updated." });
    }
  });
}
