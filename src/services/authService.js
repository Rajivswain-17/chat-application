import axios from "axios";

const API_URL = "http://localhost:8080";

/**
 * ✅ Public API
 * Used for: signup, login
 * ❌ NO cookies
 * ❌ NO credentials
 */
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ✅ Private API
 * Used for: authenticated requests
 * ✅ cookies allowed (if backend needs them)
 */
const privateApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/**
 * 🔁 Response Interceptor (PRIVATE ONLY)
 */
privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          authService.logout();
          window.location.href = "/login";
          break;
        case 403:
          console.error("Access forbidden");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Server error");
          break;
        default:
          console.error("API error:", error.response.status);
      }
    } else if (error.request) {
      console.error("No response from server");
    } else {
      console.error("Request error:", error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 🎨 Random color generator
 */
const generateUserColor = () => {
  const colors = [
    "#e6194b",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
    "#46f0f0",
    "#f032e6",
    "#bcf60c",
    "#fabebe",
    "#008080",
    "#e6beff",
    "#9a6324",
    "#fffac8",
    "#800000",
    "#aaffc3",
    "#808000",
    "#ffd8b1",
    "#000075",
    "#808080",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * ✅ Auth Service
 */
const authService = {
  // 🔐 LOGIN
  login: async (username, password) => {
    try {
      const response = await publicApi.post("/auth/login", {
        username,
        password,
      });

      const userColor = generateUserColor();
      const userData = {
        ...response.data,
        color: userColor,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("currentUser", JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(
        error.response?.data?.error || "Login failed. Please try again."
      );
    }
  },

  // 📝 SIGNUP (FIXED — NO 403)
  signup: async (username, email, password) => {
    try {
      const response = await publicApi.post("/auth/signup", {
        username,
        email,
        password,
      });

      return { success: true, user: response.data };
    } catch (error) {
      console.error("Signup failed:", error);
      throw new Error(
        error.response?.data?.error || "Signup failed. Please try again."
      );
    }
  },

  // 🚪 LOGOUT
  logout: async () => {
    try {
      await privateApi.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("currentUser");
    }
  },

  // 👤 GET CURRENT USER
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("currentUser");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  },

  // ✅ AUTH CHECK
  isAuthenticated: () => {
    return !!localStorage.getItem("currentUser");
  },

  // 🟢 ONLINE USERS (AUTH REQUIRED)
  getOnlineUsers: async () => {
    try {
      const response = await privateApi.get("/auth/getonlineusers");
      return response.data;
    } catch (error) {
      console.error("Error fetching online users:", error);
      throw error;
    }
  },
};

export default authService;
