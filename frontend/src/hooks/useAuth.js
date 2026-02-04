/**
 * useAuth: reads token from localStorage, exposes isAuthed, setToken.
 */
import { useState } from "react";

const TOKEN_KEY = "token";

export function useAuth() {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const isAuthed = !!token;

  const setToken = (value) => {
    if (value == null) {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
    } else {
      localStorage.setItem(TOKEN_KEY, value);
      setTokenState(value);
    }
  };

  return { token, isAuthed, setToken };
}
