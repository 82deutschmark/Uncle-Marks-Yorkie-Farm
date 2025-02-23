import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import StoryViewer from "@/pages/story-viewer";
import DetailsPage from "@/pages/details";
import StoryGenerationPage from "@/pages/story-generation";
import YorkieSelector from "@/pages/yorkie-selector";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/details" component={DetailsPage} />
      <Route path="/story/:id" component={StoryViewer} />
      <Route path="/story-generation" component={StoryGenerationPage} />
      <Route path="/select-yorkie" component={YorkieSelector} />
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