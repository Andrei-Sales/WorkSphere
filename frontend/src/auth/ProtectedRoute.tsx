/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { getCurrentUser } from "../api/auth.api";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { user, setUser } = useAuth();

  const [isCheckingSession, setIsCheckingSession] = useState(!user);

  useEffect(() => {
    if (user) {
      setIsCheckingSession(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    restoreSession();
  }, [user, setUser]);

  if (isCheckingSession) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
