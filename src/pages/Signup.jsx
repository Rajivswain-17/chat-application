import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await authService.signup(username, email, password);
      if (result.success) {
        setMessage("Signup successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      setMessage(error.message || "Signup failed. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h2>Signup</h2>
          <p>Create an account to start chatting</p>
        </div>
        <form onSubmit={handleSignup} className="signup-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            maxLength={20}
            required
            disabled={isLoading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="username-input"
            maxLength={50}
            required
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="username-input"
            maxLength={20}
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={
              !username.trim() ||
              !email.trim() ||
              !password.trim() ||
              isLoading
            }
            className="join-btn"
          >
            {isLoading ? "Creating Account..." : "Signup"}
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

export default Signup;