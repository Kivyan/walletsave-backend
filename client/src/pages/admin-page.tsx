import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Eye,
  UserX,
  UserCheck
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminStats {
  totalUsers: number;
  totalExpenses: number;
  totalAmount: number;
  activeUsers: number;
}

interface UserWithStats {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isBlocked: boolean;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
  expenseCount: number;
  totalSpent: number;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    user: UserWithStats;
    action: 'block' | 'unblock';
  } | null>(null);

  // Verificar se o usuário é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // Buscar estatísticas administrativas
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/stats');
      return await res.json();
    },
  });

  // Buscar todos os usuários
  const { data: users } = useQuery<UserWithStats[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return await res.json();
    },
  });

  // Mutation para bloquear/desbloquear usuário
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: number; block: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}/block`, { block });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Sucesso",
        description: actionDialog?.action === 'block' 
          ? "Usuário bloqueado com sucesso"
          : "Usuário desbloqueado com sucesso",
      });
      setActionDialog(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUserAction = (user: UserWithStats, action: 'block' | 'unblock') => {
    setActionDialog({ user, action });
  };

  const confirmAction = () => {
    if (actionDialog) {
      blockUserMutation.mutate({
        userId: actionDialog.user.id,
        block: actionDialog.action === 'block'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-24 md:pb-0">
      <Header title="Painel Administrativo" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalExpenses || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMoney(stats?.totalAmount || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Layout Mobile/Tablet - Cards */}
            <div className="md:hidden space-y-4 p-6">
              {users?.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium break-words">{user.fullName}</h3>
                        <p className="text-sm text-neutral-500 break-all">{user.username}</p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            variant={user.isBlocked ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleUserAction(user, user.isBlocked ? 'unblock' : 'block')}
                          >
                            {user.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-neutral-500">Status:</span>
                        <div className="mt-1">
                          <Badge 
                            variant={user.isBlocked ? "destructive" : "default"}
                            className={user.role === 'admin' ? "bg-purple-100 text-purple-800" : ""}
                          >
                            {user.isBlocked ? "Bloqueado" : user.role === 'admin' ? "Admin" : "Ativo"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-neutral-500">Verificado:</span>
                        <div className="mt-1">
                          <Badge variant={user.isVerified ? "default" : "secondary"}>
                            {user.isVerified ? "Sim" : "Não"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-neutral-500">Despesas:</span>
                        <div className="font-medium">{user.expenseCount}</div>
                      </div>
                      
                      <div>
                        <span className="text-neutral-500">Total Gasto:</span>
                        <div className="font-medium">{formatMoney(user.totalSpent)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-neutral-500 text-sm">Último Acesso:</span>
                      <div className="text-sm">{formatDate(user.lastActiveAt)}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Layout Desktop - Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Usuário</TableHead>
                    <TableHead className="w-1/6">Nome</TableHead>
                    <TableHead className="w-1/8">Status</TableHead>
                    <TableHead className="w-1/8">Verificado</TableHead>
                    <TableHead className="w-1/12">Despesas</TableHead>
                    <TableHead className="w-1/8">Total Gasto</TableHead>
                    <TableHead className="w-1/6">Último Acesso</TableHead>
                    <TableHead className="w-1/8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="break-all">{user.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="break-words">{user.fullName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isBlocked ? "destructive" : "default"}
                          className={user.role === 'admin' ? "bg-purple-100 text-purple-800" : ""}
                        >
                          {user.isBlocked ? "Bloqueado" : user.role === 'admin' ? "Admin" : "Ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? "default" : "secondary"}>
                          {user.isVerified ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.expenseCount}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatMoney(user.totalSpent)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(user.lastActiveAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant={user.isBlocked ? "default" : "destructive"}
                              size="sm"
                              onClick={() => handleUserAction(user, user.isBlocked ? 'unblock' : 'block')}
                            >
                              {user.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Ação */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'block' ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja {actionDialog?.action === 'block' ? 'bloquear' : 'desbloquear'} o usuário{' '}
              <strong>{actionDialog?.user.username}</strong>?
              {actionDialog?.action === 'block' && 
                ' O usuário não conseguirá mais acessar o sistema.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              variant={actionDialog?.action === 'block' ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={blockUserMutation.isPending}
            >
              {blockUserMutation.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Usuário */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Email:</strong> {selectedUser.username}
                </div>
                <div>
                  <strong>Nome:</strong> {selectedUser.fullName}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedUser.role === 'admin' ? 'Administrador' : 'Usuário'}
                </div>
                <div>
                  <strong>Status:</strong> {selectedUser.isBlocked ? 'Bloqueado' : 'Ativo'}
                </div>
                <div>
                  <strong>Verificado:</strong> {selectedUser.isVerified ? 'Sim' : 'Não'}
                </div>
                <div>
                  <strong>Cadastrado em:</strong> {formatDate(selectedUser.createdAt)}
                </div>
                <div>
                  <strong>Último acesso:</strong> {formatDate(selectedUser.lastActiveAt)}
                </div>
                <div>
                  <strong>Total de despesas:</strong> {selectedUser.expenseCount}
                </div>
                <div>
                  <strong>Total gasto:</strong> {formatMoney(selectedUser.totalSpent)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedUser(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}