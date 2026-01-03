import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await authService.login(username, password);
      if (result.success) {
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/chatarea");
        }, 1500);
      }
    } catch (error) {
      setMessage(error.message || "Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Login</h2>
          <p>Login to continue chatting</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            className="username-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="username-input"
          />
          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || isLoading}
            className="login-btn"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          {message && (
            <p
              className="auth-message"
              style={{
                color: message.includes("successful") ? "#4CAF50" : "#ff6b6b",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;