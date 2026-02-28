import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useAddNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contactId, body }: { contactId: number, body: string }) => {
      const url = buildUrl(api.contacts.addNote.path, { id: contactId });
      const res = await fetch(url, {
        method: api.contacts.addNote.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add note");
      return api.contacts.addNote.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate all conversation fetches since notes are returned there
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path] });
      toast({ title: "Note Added", description: "The note has been saved to the contact." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contactId, tags }: { contactId: number, tags: string[] }) => {
      const url = buildUrl(api.contacts.updateTags.path, { id: contactId });
      const res = await fetch(url, {
        method: api.contacts.updateTags.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update tags");
      return api.contacts.updateTags.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path] });
      toast({ title: "Tags Updated", description: "Contact tags have been updated." });
    }
  });
}
