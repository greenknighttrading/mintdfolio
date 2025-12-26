import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Insights from "./pages/Insights";
import Winners from "./pages/Winners";
import Rebalance from "./pages/Rebalance";
import Report from "./pages/Report";
import GeneratedReport from "./pages/GeneratedReport";
import PrintReport from "./pages/PrintReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main application component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PortfolioProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Standalone report pages - no layout */}
            <Route path="/report/generated" element={<GeneratedReport />} />
            <Route path="/report/print" element={<PrintReport />} />
            
            {/* All other pages with AppLayout */}
            <Route element={<AppLayout><Index /></AppLayout>} path="/" />
            <Route path="/insights" element={<AppLayout><Insights /></AppLayout>} />
            <Route path="/winners" element={<AppLayout><Winners /></AppLayout>} />
            <Route path="/rebalance" element={<AppLayout><Rebalance /></AppLayout>} />
            <Route path="/report" element={<AppLayout><Report /></AppLayout>} />
            <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
          </Routes>
        </BrowserRouter>
      </PortfolioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
