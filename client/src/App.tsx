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
import FinancePage from "@/pages/finance-page-new";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationButtons } from "@/components/navigation-buttons";
import { ReactElement } from "react";
import { AutoScaleContainer } from "@/components/auto-scale-container";

function Router(): ReactElement {
  const renderHomePage = (): ReactElement => <HomePage />;
  const renderProfilePage = (): ReactElement => <ProfilePage />;
  const renderWalletPage = (): ReactElement => <WalletPage />;
  const renderReportsPage = (): ReactElement => <ReportsPage />;
  const renderSavingsPage = (): ReactElement => <SavingsPage />;
  const renderFinancePage = (): ReactElement => <FinancePage />;
  const renderTermsOfService = (): ReactElement => <TermsOfService />;
  const renderPrivacyPolicy = (): ReactElement => <PrivacyPolicy />;

  return (
    <Switch>
      <ProtectedRoute path="/" component={renderHomePage} />
      <ProtectedRoute path="/profile" component={renderProfilePage} />
      <ProtectedRoute path="/wallet" component={renderWalletPage} />
      <ProtectedRoute path="/finance" component={renderFinancePage} />
      <ProtectedRoute path="/reports" component={renderReportsPage} />
      <ProtectedRoute path="/savings" component={renderSavingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/terms-of-service" component={renderTermsOfService} />
      <Route path="/privacy-policy" component={renderPrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AutoScaleContainer>
            <Router />
            <NavigationButtons />
            <Toaster />
          </AutoScaleContainer>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
