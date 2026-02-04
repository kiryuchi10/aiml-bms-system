/**
 * AuthGate: 토큰 없으면 /login으로 리다이렉트.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AuthGate({ children }) {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
