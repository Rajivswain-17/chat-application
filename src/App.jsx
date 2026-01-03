import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ChatArea from "./pages/ChatArea";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import "./index.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

        <Routes>
          {/* LANDING PAGE */}
          <Route path="/" element={<LandingPage />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* CHAT */}
          <Route
            path="/chatarea"
            element={
              <ProtectedRoute>
                <ChatArea />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
