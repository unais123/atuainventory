import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Customers from "@/pages/Customers";
import ServiceRequests from "@/pages/ServiceRequests";
import Invoices from "@/pages/Invoices";
import Suppliers from "@/pages/Suppliers";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/service-requests" element={<ServiceRequests />} />
            <Route path="/service-jobs" element={<PlaceholderPage title="Service Jobs" />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<PlaceholderPage title="Payments" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports & Analytics" />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
