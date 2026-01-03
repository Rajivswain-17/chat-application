import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="lp-container">
      <div className="lp-header">
        <h1>Chat Application</h1>
        <p>Choose how you want to start chatting</p>
      </div>

      <div className="lp-cards">
        {/* GROUP CHAT */}
        <div
          className="lp-card"
          onClick={() => navigate("/chatarea")}
        >
          <div className="lp-icon">👥</div>
          <h3>Multiple Users</h3>
          <p>
            Join the public group chat and talk with everyone online.
          </p>
        </div>

        {/* PRIVATE CHAT */}
        <div
          className="lp-card"
          onClick={() => navigate("/chatarea?mode=private")}
        >
          <div className="lp-icon">🔒</div>
          <h3>Private Chats</h3>
          <p>
            Start one-to-one private conversations securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
