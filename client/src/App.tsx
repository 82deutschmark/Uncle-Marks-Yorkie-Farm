import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import StoryViewer from "@/pages/story-viewer";
import UploadPage from "@/pages/upload";
import { StoryForm } from "@/components/story-form";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={StoryForm} />
      <Route path="/story/:id" component={StoryViewer} />
      <Route path="/upload" component={UploadPage} />
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