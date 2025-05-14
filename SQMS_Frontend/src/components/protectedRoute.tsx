import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.warning("Login required", {
        description: "Please login or sign up to continue.",
        action: {
          label: "Go to Login",
          onClick: () => navigate("/login"),
        },
      });

      setIsAuthenticated(false);
      setTimeout(() => {
        navigate("/login");
      }, 2000); // give time for toast
    } else {
      setIsAuthenticated(true);
    }

    setCheckingAuth(false);
  }, [navigate]);

  if (checkingAuth) return null; // don't render anything until auth is checked

  return <>{isAuthenticated ? children : null}</>;
};

export default ProtectedRoute;
