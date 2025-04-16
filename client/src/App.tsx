import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import WalletPage from "@/pages/wallet-page";
import ReportsPage from "@/pages/reports-page";
import SavingsPage from "@/pages/savings-page";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { ReactElement } from "react";

function Router(): ReactElement {
  const renderHomePage = (): ReactElement => <HomePage />;
  const renderProfilePage = (): ReactElement => <ProfilePage />;
  const renderWalletPage = (): ReactElement => <WalletPage />;
  const renderReportsPage = (): ReactElement => <ReportsPage />;
  const renderSavingsPage = (): ReactElement => <SavingsPage />;

  return (
    <Switch>
      <ProtectedRoute path="/" component={renderHomePage} />
      <ProtectedRoute path="/profile" component={renderProfilePage} />
      <ProtectedRoute path="/wallet" component={renderWalletPage} />
      <ProtectedRoute path="/reports" component={renderReportsPage} />
      <ProtectedRoute path="/savings" component={renderSavingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <Router />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
