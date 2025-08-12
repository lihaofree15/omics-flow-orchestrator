// Redirects to Dashboard - this file is kept for compatibility
import { Navigate } from "react-router-dom";

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
