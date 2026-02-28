import { useState } from "react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useConversations, 
  useConversation, 
  useSendMessage, 
  useUpdateConversationStatus,
  useAssignConversation 
} from "@/hooks/use-conversations";
import { useAddNote, useUpdateTags } from "@/hooks/use-contacts";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { 
  Search, Filter, Send, Phone, User as UserIcon, Tag, Clock, CheckCircle2, MoreVertical, X, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function InboxPage() {
  const { user } = useAuth();
  const { data: conversations, isLoading: isLoadingList } = useConversations();
  const { data: users } = useUsers();
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activeChat, isLoading: isLoadingChat } = useConversation(selectedId);
  const sendMessage = useSendMessage(selectedId);
  const updateStatus = useUpdateConversationStatus();
  const assignUser = useAssignConversation();
  const addNote = useAddNote();
  const updateTags = useUpdateTags();

  const [messageInput, setMessageInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  
  // Mobile View State Management (List -> Chat -> Info)
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list');

  const filteredConversations = conversations?.filter(c => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (assigneeFilter === "MINE" && c.assignedToUserId !== user?.id) return false;
    if (searchQuery && !c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.contact.waId.includes(searchQuery)) return false;
    return true;
  });

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage.mutate({ body: messageInput });
    setMessageInput("");
  };

  const handleAddNote = () => {
    if (!noteInput.trim() || !activeChat?.contact.id) return;
    addNote.mutate({ contactId: activeChat.contact.id, body: noteInput });
    setNoteInput("");
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && activeChat?.contact) {
      const currentTags = activeChat.contact.tags as string[] || [];
      if (!currentTags.includes(tagInput.trim())) {
        updateTags.mutate({ 
          contactId: activeChat.contact.id, 
          tags: [...currentTags, tagInput.trim()] 
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeChat?.contact) return;
    const currentTags = activeChat.contact.tags as string[] || [];
    updateTags.mutate({ 
      contactId: activeChat.contact.id, 
      tags: currentTags.filter(t => t !== tagToRemove) 
    });
  };

  const quickReplies = ["Hello! How can I help you today?", "Please wait a moment.", "Your issue has been resolved."];

  return (
    <AppLayout>
      <div className="flex flex-1 h-full overflow-hidden bg-background">
        
        {/* Left Panel: Conversation List */}
        <div className={`w-full md:w-[320px] lg:w-[380px] flex flex-col border-r border-border/50 bg-background/50 ${mobileView !== 'list' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border/50 bg-card z-10 shadow-sm">
            <h1 className="text-xl font-display font-bold mb-4">Inbox</h1>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages..." 
                className="pl-9 bg-muted/50 border-none h-10 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mb-2">
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger value="OPEN" className="rounded-md text-xs font-medium data-[state=active]:shadow-sm">Open</TabsTrigger>
                  <TabsTrigger value="PENDING" className="rounded-md text-xs font-medium data-[state=active]:shadow-sm">Pending</TabsTrigger>
                  <TabsTrigger value="CLOSED" className="rounded-md text-xs font-medium data-[state=active]:shadow-sm">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={assigneeFilter === "ALL" ? "secondary" : "ghost"} 
                size="sm" 
                className={`flex-1 text-xs rounded-lg h-8 ${assigneeFilter === "ALL" ? "font-semibold" : ""}`}
                onClick={() => setAssigneeFilter("ALL")}
              >
                All
              </Button>
              <Button 
                variant={assigneeFilter === "MINE" ? "secondary" : "ghost"} 
                size="sm" 
                className={`flex-1 text-xs rounded-lg h-8 ${assigneeFilter === "MINE" ? "font-semibold" : ""}`}
                onClick={() => setAssigneeFilter("MINE")}
              >
                Assigned to me
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 flex flex-col gap-1.5">
              {isLoadingList ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading conversations...</div>
              ) : filteredConversations?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 opacity-20 mb-3" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                filteredConversations?.map((conv) => (
                  <div 
                    key={conv.id}
                    onClick={() => {
                      setSelectedId(conv.id);
                      setMobileView('chat');
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                      selectedId === conv.id 
                        ? 'bg-primary/5 border-primary/20 shadow-sm' 
                        : 'bg-card border-transparent hover:bg-muted/50 hover:border-border/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm truncate pr-2 text-foreground">{conv.contact.name}</h3>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5 font-medium">
                          {format(new Date(conv.lastMessageAt), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 uppercase ${
                        conv.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        conv.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-zinc-100 text-zinc-500 border-zinc-200'
                      }`}>
                        {conv.status}
                      </Badge>
                      {conv.assignedToUserId === user?.id && (
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel: Active Chat */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white ${mobileView !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
          {selectedId && activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border/50 flex items-center justify-between px-4 sm:px-6 bg-card shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground" onClick={() => setMobileView('list')}>
                    <X className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-primary/5 text-primary font-medium">{activeChat.contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-base leading-none mb-1">{activeChat.contact.name}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {activeChat.contact.waId}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground" onClick={() => setMobileView('info')}>
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  
                  <div className="hidden sm:flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 rounded-lg border-dashed">
                          {activeChat.conversation.status}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selectedId, status: "OPEN" })}>Mark as Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selectedId, status: "PENDING" })}>Mark as Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selectedId, status: "CLOSED" })}>Mark as Closed</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-9 rounded-lg">
                          {activeChat.conversation.assignedToUserId ? "Reassign" : "Assign"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => assignUser.mutate({ id: selectedId, userId: user?.id || null })}>
                          Assign to me
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => assignUser.mutate({ id: selectedId, userId: null })}>
                          Unassign
                        </DropdownMenuItem>
                        {users?.map(u => (
                          <DropdownMenuItem key={u.id} onClick={() => assignUser.mutate({ id: selectedId, userId: u.id })}>
                            Assign to {u.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 sm:p-6 bg-zinc-50/50">
                <div className="space-y-6 max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-4">
                  {activeChat.messages.map((msg, idx) => {
                    const isOutbound = msg.direction === "OUTBOUND";
                    const isSystem = msg.type === "SYSTEM"; // Assuming there might be system msgs
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          isOutbound 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-white border border-border/50 text-foreground rounded-tl-sm'
                        }`}>
                          <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 px-1 text-[11px] text-muted-foreground font-medium">
                          {format(new Date(msg.createdAt!), "MMM d, HH:mm")}
                          {isOutbound && (
                            <CheckCircle2 className={`h-3 w-3 ml-1 ${msg.status === 'READ' ? 'text-blue-500' : 'opacity-50'}`} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 bg-card border-t border-border/50 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                <div className="max-w-3xl mx-auto">
                  {/* Quick Replies */}
                  <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                    {quickReplies.map((qr, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="cursor-pointer whitespace-nowrap bg-muted/50 hover:bg-muted font-normal text-xs py-1.5 rounded-lg border-transparent transition-colors"
                        onClick={() => setMessageInput(qr)}
                      >
                        {qr}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-2xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Textarea 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="min-h-[44px] max-h-[150px] border-none bg-transparent resize-none focus-visible:ring-0 shadow-none text-base p-2"
                      disabled={sendMessage.isPending}
                    />
                    <Button 
                      size="icon" 
                      className="h-10 w-10 shrink-0 rounded-xl mb-1 mr-1 shadow-md shadow-primary/20" 
                      onClick={handleSend}
                      disabled={sendMessage.isPending || !messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-zinc-50/50">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border/50">
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">No conversation selected</h3>
              <p className="text-sm">Choose a contact from the list to start messaging.</p>
            </div>
          )}
        </div>

        {/* Right Panel: Contact Info */}
        <div className={`w-full lg:w-[320px] xl:w-[360px] border-l border-border/50 bg-card flex flex-col ${mobileView !== 'info' ? 'hidden lg:flex' : 'flex z-20 absolute inset-0'}`}>
          {selectedId && activeChat ? (
            <>
              <div className="h-16 border-b border-border/50 flex items-center px-4 shrink-0 lg:hidden">
                <Button variant="ghost" size="icon" className="-ml-2 mr-2" onClick={() => setMobileView('chat')}>
                  <X className="h-5 w-5" />
                </Button>
                <h2 className="font-semibold">Contact Details</h2>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {/* Profile Block */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <Avatar className="h-24 w-24 mb-4 ring-4 ring-muted">
                      <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-display font-medium">
                        {activeChat.contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-display font-bold text-foreground">{activeChat.contact.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                      <Phone className="h-3.5 w-3.5" />
                      {activeChat.contact.waId}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Tags Section */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> Tags
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {((activeChat.contact.tags as string[]) || []).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs py-1 px-2.5 rounded-md flex items-center gap-1 bg-primary/5 text-primary hover:bg-primary/10 border-primary/10">
                            {tag}
                            <X className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleRemoveTag(tag)} />
                          </Badge>
                        ))}
                      </div>
                      <Input 
                        placeholder="Add a tag and press Enter" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="h-9 text-sm rounded-lg bg-muted/30 border-dashed focus-visible:ring-primary/20"
                      />
                    </div>

                    {/* Notes Section */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" /> Internal Notes
                      </h3>
                      
                      <div className="mb-4">
                        <Textarea 
                          placeholder="Type a private note..." 
                          className="min-h-[80px] text-sm resize-none rounded-xl bg-amber-50/30 border-amber-200/50 focus-visible:ring-amber-500/20"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <Button size="sm" onClick={handleAddNote} disabled={!noteInput.trim() || addNote.isPending} className="rounded-lg h-8 px-4 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                            Save Note
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {activeChat.notes.map(note => (
                          <div key={note.id} className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl animate-in fade-in duration-300">
                            <p className="text-sm text-foreground mb-2 leading-relaxed">{note.body}</p>
                            <div className="flex items-center justify-between text-[10px] font-medium text-amber-700/60">
                              <span className="flex items-center gap-1">
                                <Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[8px] bg-amber-200 text-amber-800">A</AvatarFallback></Avatar>
                                User {note.createdByUserId}
                              </span>
                              <span>{format(new Date(note.createdAt!), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                        ))}
                        {activeChat.notes.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-xl border-border/50">No notes yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-6 text-center">
              Select a conversation to view contact details
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
