import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Inbox, 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = [
    { label: "Inbox", path: "/", icon: Inbox, roles: ["ADMIN", "SUPERVISOR", "AGENT", "READONLY"] },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SUPERVISOR"] },
    { label: "Users", path: "/users", icon: Users, roles: ["ADMIN"] },
  ].filter(item => item.roles.includes(user.role));

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.path;
        return (
          <Link key={item.path} href={item.path} className="w-full">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 mb-1 ${isActive ? 'font-semibold bg-primary/5 text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden glass sticky top-0 z-40 flex items-center justify-between p-4">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          OmniChat
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 flex flex-col">
            <div className="flex items-center gap-2 font-display font-bold text-2xl mb-8 mt-4">
              <MessageSquare className="h-6 w-6 text-primary" />
              OmniChat
            </div>
            <nav className="flex-1">
              <NavLinks />
            </nav>
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 mb-4 px-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.role}</span>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => logout()}>
                <LogOut className="h-5 w-5" />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card/50 px-4 py-6">
        <div className="flex items-center gap-2 font-display font-bold text-2xl mb-8 px-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          OmniChat
        </div>
        
        <nav className="flex-1">
          <NavLinks />
        </nav>

        <div className="pt-4 mt-auto">
          <div className="bg-background rounded-xl p-3 border border-border/50 shadow-sm mb-2 flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] md:h-screen overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
