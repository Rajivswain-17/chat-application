import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import PrivateChat from "./PrivateChat";

const ChatArea = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState("");
  const [privateChats, setPrivateChats] = useState(new Map());
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState([]);

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const privateMessageHandlers = useRef(new Map());
  const userColorsRef = useRef({});

  const emojis = ["😀", "😂", "😍", "😎", "😭", "👍", "❤️", "🎉"];

  // ---------- AUTH CHECK ----------
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUser) return null;

  const { username, color: userColor } = currentUser;

  // ---------- USER COLOR ----------
  const getUserColor = (user) => {
    if (user === username) return userColor;
    if (!userColorsRef.current[user]) {
      userColorsRef.current[user] = `hsl(${Math.floor(
        Math.random() * 360
      )}, 70%, 50%)`;
    }
    return userColorsRef.current[user];
  };

  // ---------- PRIVATE CHAT HANDLERS ----------
  const registerPrivateMessageHandler = useCallback((user, handler) => {
    privateMessageHandlers.current.set(user, handler);
  }, []);

  const unregisterPrivateMessageHandler = useCallback((user) => {
    privateMessageHandlers.current.delete(user);
  }, []);

  // ---------- FETCH ONLINE USERS ----------
  const fetchOnlineUsers = async () => {
    try {
      const res = await authService.getOnlineUsers();
      if (res?.users) {
        setOnlineUsers(res.users.map((u) => u.username));
      }
    } catch (err) {
      console.error("Online users error", err);
    }
  };

  // ---------- WEBSOCKET ----------
  useEffect(() => {
    if (!username) return;

    const socket = new SockJS("http://localhost:8080/ws");
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = () => {};

    stompClient.current.connect({}, () => {
      fetchOnlineUsers();

      stompClient.current.subscribe("/topic/public", (msg) => {
        const data = JSON.parse(msg.body);

        if (data.type === "TYPING") {
          setIsTyping(data.sender);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(""), 1500);
          return;
        }

        if (data.type === "JOIN" || data.type === "LEAVE") {
          fetchOnlineUsers();
        }

        setMessages((prev) => [
          ...prev,
          {
            ...data,
            id: Date.now() + Math.random(),
            timestamp: data.timestamp || new Date().toISOString(),
          },
        ]);
      });

      stompClient.current.subscribe(
        `/user/${username}/queue/private`,
        (msg) => {
          const data = JSON.parse(msg.body);
          const other =
            data.sender === username ? data.recipient : data.sender;

          const handler = privateMessageHandlers.current.get(other);
          if (handler) handler(data);
          else {
            setUnreadMessages((prev) => {
              const m = new Map(prev);
              m.set(other, (m.get(other) || 0) + 1);
              return m;
            });
          }
        }
      );

      stompClient.current.send(
        "/app/chat.addUser",
        {},
        JSON.stringify({ sender: username, type: "JOIN", color: userColor })
      );
    });

    const interval = setInterval(fetchOnlineUsers, 5000);

    return () => {
      clearInterval(interval);
      stompClient.current?.disconnect();
    };
  }, [username, userColor]);

  // ---------- SEND MESSAGE ----------
  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    stompClient.current.send(
      "/app/chat.sendMessage",
      {},
      JSON.stringify({
        sender: username,
        content: message,
        type: "CHAT",
        color: userColor,
      })
    );

    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    stompClient.current.send(
      "/app/chat.sendMessage",
      {},
      JSON.stringify({ sender: username, type: "TYPING" })
    );
  };

  // ---------- EMOJI (FIXED) ----------
  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const openPrivateChat = (user) => {
    if (user === username) return;
    setPrivateChats((prev) => new Map(prev.set(user, true)));
    setUnreadMessages((prev) => {
      const m = new Map(prev);
      m.delete(user);
      return m;
    });
  };

  const closePrivateChat = (user) => {
    setPrivateChats((prev) => {
      const m = new Map(prev);
      m.delete(user);
      return m;
    });
    unregisterPrivateMessageHandler(user);
  };

  // ---------- UI ----------
  return (
    <div className="chat-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Users ({onlineUsers.length})</h2>
        </div>

        <div className="users-list">
          {onlineUsers.map((user) => (
            <div
              key={user}
              className={`user-item ${
                user === username ? "current-user" : ""
              }`}
              onClick={() => openPrivateChat(user)}
            >
              <div
                className="user-avatar"
                style={{ backgroundColor: getUserColor(user) }}
              >
                {user[0].toUpperCase()}
              </div>
              <span>{user}</span>
              {user === username && <span className="you-label">(You)</span>}
              {unreadMessages.get(user) && (
                <span className="unread-count">
                  {unreadMessages.get(user)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className="main-chat">
        <div className="messages-container">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message chat-message ${
                msg.sender === username ? "own-message" : ""
              }`}
            >
              {msg.type === "CHAT" && (
                <>
                  <div className="message-info">
                    <span
                      className="sender"
                      style={{ color: getUserColor(msg.sender) }}
                    >
                      {msg.sender === username ? "You" : msg.sender}
                    </span>
                    <span className="time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-text">{msg.content}</div>
                </>
              )}
            </div>
          ))}

          {isTyping && isTyping !== username && (
            <div className="typing-indicator">{isTyping} is typing...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="input-area">
          {showEmojiPicker && (
            <div className="emoji-picker">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    addEmoji(e);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <form className="message-form" onSubmit={sendMessage}>
            <button
              type="button"
              className="emoji-btn"
              onClick={() => setShowEmojiPicker((p) => !p)}
            >
              😊
            </button>

            <input
              className="message-input"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
            />

            <button className="send-btn" disabled={!message.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>

      {/* PRIVATE CHATS */}
      {[...privateChats.keys()].map((u) => (
        <PrivateChat
          key={u}
          currentUser={username}
          recipientUser={u}
          userColor={userColor}
          stompClient={stompClient}
          onClose={() => closePrivateChat(u)}
          registerPrivateMessageHandler={registerPrivateMessageHandler}
          unregisterPrivateMessageHandler={unregisterPrivateMessageHandler}
        />
      ))}
    </div>
  );
};

export default ChatArea;
