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
// Wallet integrado na página de Finanças
import ReportsPage from "@/pages/reports-page";
import SavingsPage from "@/pages/savings-page";
import FinancePage from "@/pages/finance-page-simplified";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import ResetPasswordPage from "@/pages/reset-password-page";
import AdminPage from "@/pages/admin-page";
import { ThemeProvider } from "@/hooks/use-theme";
import { NavigationButtons } from "@/components/navigation-buttons";
import { ReactElement } from "react";
import { AutoScaleContainer } from "@/components/auto-scale-container";
import { I18nProvider } from "@/components/i18n-provider";
import { LanguageDemo } from "@/components/language-demo";

function Router(): ReactElement {
  const renderHomePage = (): ReactElement => <HomePage />;
  const renderProfilePage = (): ReactElement => <ProfilePage />;
  const renderReportsPage = (): ReactElement => <ReportsPage />;
  const renderSavingsPage = (): ReactElement => <SavingsPage />;
  const renderFinancePage = (): ReactElement => <FinancePage />;
  const renderTermsOfService = (): ReactElement => <TermsOfService />;
  const renderPrivacyPolicy = (): ReactElement => <PrivacyPolicy />;
  const renderLanguageDemo = (): ReactElement => <LanguageDemo />;
  const renderResetPasswordPage = (): ReactElement => <ResetPasswordPage />;
  const renderAdminPage = (): ReactElement => <AdminPage />;

  return (
    <Switch>
      <ProtectedRoute path="/" component={renderHomePage} />
      <ProtectedRoute path="/profile" component={renderProfilePage} />
      <ProtectedRoute path="/finance" component={renderFinancePage} />
      <ProtectedRoute path="/reports" component={renderReportsPage} />
      <ProtectedRoute path="/savings" component={renderSavingsPage} />
      <ProtectedRoute path="/admin" component={renderAdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={renderResetPasswordPage} />
      <Route path="/reset-password/:token" component={renderResetPasswordPage} />
      <Route path="/terms-of-service" component={renderTermsOfService} />
      <Route path="/privacy-policy" component={renderPrivacyPolicy} />
      <Route path="/language-demo" component={renderLanguageDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="wallet-save-theme">
          <I18nProvider>
            <AutoScaleContainer>
              <Router />
              <NavigationButtons />
              <Toaster />
            </AutoScaleContainer>
          </I18nProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
