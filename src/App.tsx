import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DataManagement from "./pages/DataManagement";
import TranscriptomeAnalysis from "./pages/TranscriptomeAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="data-management" element={<DataManagement />} />
            <Route path="workflows/transcriptome" element={<TranscriptomeAnalysis />} />
            <Route path="workflows/single-cell" element={<div>单细胞分析页面开发中...</div>} />
            <Route path="workflows/genomics" element={<div>基因组分析页面开发中...</div>} />
            <Route path="results" element={<div>结果展示页面开发中...</div>} />
            <Route path="monitoring" element={<div>系统监控页面开发中...</div>} />
            <Route path="settings" element={<div>设置页面开发中...</div>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
