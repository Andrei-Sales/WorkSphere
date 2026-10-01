import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./AuthContext";

interface RoleRouteProps {
  allowedRoles: number[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.roleId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
