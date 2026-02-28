import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageSquare, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof api.auth.login.input>>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: { email: "", password: "" },
  });

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 z-10 mx-4">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2 text-center">Enter your details to access the agent workspace.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Email address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="name@organization.com" 
                      className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-primary/20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel className="font-semibold">Password</FormLabel>
                  </div>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-primary/20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 mt-4"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
