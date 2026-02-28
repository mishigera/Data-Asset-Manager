import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { z } from "zod";
import { Plus, Edit2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const formSchema = editingUserId ? api.users.update.input : api.users.create.input;
  
  const form = useForm({
    // @ts-ignore - complex union issue with conditional schema
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "AGENT",
      organizationId: 1, // Assuming org 1 for simple lite build
    },
  });

  const openEditDialog = (user: any) => {
    setEditingUserId(user.id);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUserId(null);
    form.reset({ name: "", email: "", password: "", role: "AGENT", organizationId: 1 });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingUserId) {
      updateUser.mutate({ id: editingUserId, ...data }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    } else {
      createUser.mutate(data, {
        onSuccess: () => setIsDialogOpen(false)
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-8 w-full max-w-6xl mx-auto overflow-y-auto h-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Team Members</h1>
            <p className="text-muted-foreground mt-1">Manage access and roles for your organization.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="rounded-xl shadow-md font-semibold h-11 px-5">
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{editingUserId ? "Edit Member" : "Add New Member"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input className="rounded-lg h-10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" className="rounded-lg h-10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {!editingUserId && (
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" className="rounded-lg h-10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg h-10">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="AGENT">Agent</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="READONLY">Read Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" className="rounded-xl h-11 px-6 w-full" disabled={createUser.isPending || updateUser.isPending}>
                      {createUser.isPending || updateUser.isPending ? "Saving..." : (editingUserId ? "Save Changes" : "Create Member")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold text-foreground h-12">Name</TableHead>
                <TableHead className="font-semibold text-foreground h-12">Role</TableHead>
                <TableHead className="font-semibold text-foreground h-12">Status</TableHead>
                <TableHead className="font-semibold text-foreground h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Loading users...</TableCell></TableRow>
              ) : users?.map((u) => (
                <TableRow key={u.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium rounded-md px-2 py-0.5 ${
                      u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      u.role === 'SUPERVISOR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}>
                      {u.role === 'ADMIN' && <ShieldAlert className="w-3 h-3 mr-1 inline" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-transparent hover:bg-emerald-50">
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)} className="h-8 rounded-lg text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
