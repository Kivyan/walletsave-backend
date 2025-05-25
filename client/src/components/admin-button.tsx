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

  // Só mostrar se o usuário é admin e não está na página admin
  if (!user || user.role !== 'admin' || location === '/admin') {
    console.log("AdminButton - Not showing because:", {
      hasUser: !!user,
      isAdmin: user?.role === 'admin',
      notOnAdminPage: location !== '/admin'
    });
    return null;
  }

  console.log("AdminButton - Showing button");

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-10">
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full w-10 h-10 p-0 shadow-md flex items-center justify-center bg-purple-100 hover:bg-purple-200 border-purple-300"
        onClick={() => navigate('/admin')}
        title="Painel Administrativo"
      >
        <Shield className="h-5 w-5 text-purple-700" />
      </Button>
    </div>
  );
}