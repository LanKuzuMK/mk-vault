import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PublicVault from "./pages/PublicVault";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={PublicVault} />
      <Route path={"/admin"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    const permitsNativeInteraction = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [data-allow-copy]"));
    const deterCasualCopying = (event: Event) => {
      if (!permitsNativeInteraction(event.target)) event.preventDefault();
    };

    document.addEventListener("contextmenu", deterCasualCopying);
    document.addEventListener("dragstart", deterCasualCopying);
    document.addEventListener("selectstart", deterCasualCopying);
    document.addEventListener("copy", deterCasualCopying);

    return () => {
      document.removeEventListener("contextmenu", deterCasualCopying);
      document.removeEventListener("dragstart", deterCasualCopying);
      document.removeEventListener("selectstart", deterCasualCopying);
      document.removeEventListener("copy", deterCasualCopying);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
