/**
 * Login: 토큰 입력 후 저장하고 / 로 이동.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) {
      setError("Enter a token");
      return;
    }
    setToken(t);
    setError("");
    navigate("/", { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">BMS Dashboard</h1>
        <p className="login-desc">
          인증용 토큰을 입력하세요. (localStorage token → Bearer)
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="login-input"
            placeholder="Token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            autoComplete="off"
          />
          {error ? <div className="error">{error}</div> : null}
          <button className="bms-btn primary" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
