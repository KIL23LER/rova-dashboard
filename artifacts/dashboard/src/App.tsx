import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) setBaseUrl(apiUrl);

const TOKEN_KEY = "rova_token";
setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";

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
import Economy from "@/pages/dashboard/economy";
import Podcast from "@/pages/dashboard/podcast";
import Announcements from "@/pages/dashboard/announcements";
import BirthdayPage from "@/pages/dashboard/birthday";
import ReactionRoles from "@/pages/dashboard/reactionroles";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function TokenCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("_token");
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      params.delete("_token");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  }, []);
  return null;
}

function wrap(Page: React.ComponentType) {
  return () => (
    <DashboardLayout>
      <Page />
    </DashboardLayout>
  );
}

function DashboardRouter() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/servers" component={Servers} />
        <Route path="/dashboard/:guildId" component={wrap(Overview)} />
        <Route path="/dashboard/:guildId/general" component={wrap(General)} />
        <Route path="/dashboard/:guildId/welcome" component={wrap(Welcome)} />
        <Route path="/dashboard/:guildId/moderation" component={wrap(Moderation)} />
        <Route path="/dashboard/:guildId/antinuke" component={wrap(Antinuke)} />
        <Route path="/dashboard/:guildId/leveling" component={wrap(Leveling)} />
        <Route path="/dashboard/:guildId/tickets" component={wrap(Tickets)} />
        <Route path="/dashboard/:guildId/suggestions" component={wrap(Suggestions)} />
        <Route path="/dashboard/:guildId/autoroles" component={wrap(Autoroles)} />
        <Route path="/dashboard/:guildId/commands" component={wrap(Commands)} />
        <Route path="/dashboard/:guildId/giveaways" component={wrap(Giveaways)} />
        <Route path="/dashboard/:guildId/logging" component={wrap(Logging)} />
        <Route path="/dashboard/:guildId/economy" component={wrap(Economy)} />
        <Route path="/dashboard/:guildId/podcast" component={wrap(Podcast)} />
        <Route path="/dashboard/:guildId/announcements" component={wrap(Announcements)} />
        <Route path="/dashboard/:guildId/birthday" component={wrap(BirthdayPage)} />
        <Route path="/dashboard/:guildId/reactionroles" component={wrap(ReactionRoles)} />
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
          <TokenCapture />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
