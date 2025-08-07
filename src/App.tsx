import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectManagement from "./pages/ProjectManagement";
import DataManagement from "./pages/DataManagement";
import TranscriptomeAnalysis from "./pages/TranscriptomeAnalysis";
import SingleCellAnalysis from "./pages/SingleCellAnalysis";
import GenomicsAnalysis from "./pages/GenomicsAnalysis";
import ResultsVisualization from "./pages/ResultsVisualization";
import SystemMonitoring from "./pages/SystemMonitoring";
import SystemSettings from "./pages/SystemSettings";
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
            <Route path="projects" element={<ProjectManagement />} />
            <Route path="data-management" element={<DataManagement />} />
            <Route path="workflows/transcriptome" element={<TranscriptomeAnalysis />} />
            <Route path="workflows/single-cell" element={<SingleCellAnalysis />} />
            <Route path="workflows/genomics" element={<GenomicsAnalysis />} />
            <Route path="results" element={<ResultsVisualization />} />
            <Route path="monitoring" element={<SystemMonitoring />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
