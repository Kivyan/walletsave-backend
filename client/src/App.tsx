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
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { NavigationButtons } from "@/components/navigation-buttons";
import { ReactElement } from "react";
import { AutoScaleContainer } from "@/components/auto-scale-container";

function Router(): ReactElement {
  const renderHomePage = (): ReactElement => <HomePage />;
  const renderProfilePage = (): ReactElement => <ProfilePage />;
  const renderWalletPage = (): ReactElement => <WalletPage />;
  const renderReportsPage = (): ReactElement => <ReportsPage />;
  const renderSavingsPage = (): ReactElement => <SavingsPage />;
  const renderTermsOfService = (): ReactElement => <TermsOfService />;
  const renderPrivacyPolicy = (): ReactElement => <PrivacyPolicy />;

  return (
    <Switch>
      <ProtectedRoute path="/" component={renderHomePage} />
      <ProtectedRoute path="/profile" component={renderProfilePage} />
      <ProtectedRoute path="/wallet" component={renderWalletPage} />
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
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <AutoScaleContainer
              targetWidth={1024}  // Base design width
              targetHeight={768}  // Base design height
              minScale={0.5}      // Mínimo 50% do tamanho original
              maxScale={1}        // Máximo 100% do tamanho original
            >
              <div className="h-full w-full flex flex-col">
                <Router />
                <NavigationButtons />
              </div>
            </AutoScaleContainer>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
