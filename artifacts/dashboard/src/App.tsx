import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { setBaseUrl } from "@workspace/api-client-react";

// When deployed to Vercel, point API calls at the Replit backend
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) setBaseUrl(apiUrl);

// Components
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";

// Pages
import Landing from "@/pages/landing";
import Servers from "@/pages/servers";
import Overview from "@/pages/dashboard/overview";
import General from "@/pages/dashboard/general";
import Welcome from "@/pages/dashboard/welcome";
import Moderation from "@/pages/dashboard/moderation";
import Antinuke from "@/pages/dashboard/antinuke";
import Leveling from "@/pages/dashboard/leveling";
import Tickets from "@/pages/dashboard/tickets";
import Suggestions from "@/pages/dashboard/suggestions";
import Autoroles from "@/pages/dashboard/autoroles";
import Commands from "@/pages/dashboard/commands";
import Giveaways from "@/pages/dashboard/giveaways";
import Logging from "@/pages/dashboard/logging";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function DashboardRouter() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/servers" component={Servers} />
        <Route path="/dashboard/:guildId" component={() => <DashboardLayout><Overview /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/general" component={() => <DashboardLayout><General /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/welcome" component={() => <DashboardLayout><Welcome /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/moderation" component={() => <DashboardLayout><Moderation /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/antinuke" component={() => <DashboardLayout><Antinuke /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/leveling" component={() => <DashboardLayout><Leveling /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/tickets" component={() => <DashboardLayout><Tickets /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/suggestions" component={() => <DashboardLayout><Suggestions /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/autoroles" component={() => <DashboardLayout><Autoroles /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/commands" component={() => <DashboardLayout><Commands /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/giveaways" component={() => <DashboardLayout><Giveaways /></DashboardLayout>} />
        <Route path="/dashboard/:guildId/logging" component={() => <DashboardLayout><Logging /></DashboardLayout>} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/servers" component={DashboardRouter} />
      <Route path="/dashboard/:rest*" component={DashboardRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
