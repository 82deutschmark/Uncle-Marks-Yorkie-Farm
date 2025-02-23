import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ReviewPage from "@/pages/create/review";
import StoryGenerationPage from "@/pages/create/story-generation";
import YorkieSelector from "@/pages/create/yorkie-selector";
import DebugPage from "@/pages/debug";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/create/review" component={ReviewPage} />
      <Route path="/story-generation" component={StoryGenerationPage} />
      <Route path="/select-yorkie" component={YorkieSelector} />
      <Route path="/debug" component={DebugPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;