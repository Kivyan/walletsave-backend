import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useLocation } from "wouter";

export function AdminButton() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Debug log para verificar o estado do usuário
  console.log("AdminButton - User:", user);
  console.log("AdminButton - User role:", user?.role);
  console.log("AdminButton - Location:", location);

  // Mostrar para walletsavecompany@gmail.com (proprietário do app) e admins
  const isOwner = user?.username === 'walletsavecompany@gmail.com';
  const isAdmin = user?.role === 'admin';
  
  if (!user || (!isOwner && !isAdmin) || location === '/admin') {
    console.log("AdminButton - Not showing because:", {
      hasUser: !!user,
      isOwner,
      isAdmin,
      notOnAdminPage: location !== '/admin'
    });
    return null;
  }

  console.log("AdminButton - Showing button");

  return (
    <div className="fixed top-20 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full w-10 h-10 p-0 bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700 shadow-lg transition-all duration-200 hover:scale-105"
        onClick={() => navigate('/admin')}
        title="Painel Administrativo"
      >
        <Shield className="h-4 w-4" />
      </Button>
    </div>
  );
}