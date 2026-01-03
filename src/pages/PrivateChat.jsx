import { useEffect, useRef, useState } from "react";

const PrivateChat = ({
  currentUser,
  recipientUser,
  userColor,
  stompClient,
  onClose,
  registerPrivateMessageHandler,
  unregisterPrivateMessageHandler,
}) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleIncomingPrivateMessage = (privateMessage) => {
    const messageId = privateMessage.id;
    
    // Check if message is relevant to this chat
    const isRelevant =
      (privateMessage.sender === currentUser && privateMessage.recipient === recipientUser) ||
      (privateMessage.sender === recipientUser && privateMessage.recipient === currentUser);

    if (isRelevant && !processedMessageIds.current.has(messageId)) {
      console.log("Adding private message:", privateMessage);
      processedMessageIds.current.add(messageId);
      
      setMessages((prev) => {
        // Double-check if message already exists
        const exists = prev.some(m => m.id === messageId);
        if (exists) return prev;
        return [...prev, privateMessage];
      });
    }
  };

  const sendPrivateMessage = (e) => {
    e.preventDefault();

    if (message.trim() && stompClient.current && stompClient.current.connected) {
      const timestamp = new Date().toISOString();

      const privateMessage = {
        sender: currentUser,
        recipient: recipientUser,
        content: message.trim(),
        type: "PRIVATE_MESSAGE",
        color: userColor,
        timestamp: timestamp,
      };

      try {
        stompClient.current.send(
          "/app/chat.sendPrivateMessage",
          {},
          JSON.stringify(privateMessage)
        );
        setMessage("");
      } catch (error) {
        console.error("Error sending private message:", error);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadMessageHistory = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/message/private?user1=${currentUser}&user2=${recipientUser}`,
          {
            credentials: 'include'
          }
        );

        if (response.ok && isMounted) {
          const history = await response.json();
          console.log("Loaded message history:", history);
          
          // Clear and rebuild processed IDs
          processedMessageIds.current.clear();
          history.forEach((msg) => {
            processedMessageIds.current.add(msg.id);
          });

          setMessages(history);
        }
      } catch (error) {
        console.error("Error loading message history:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMessageHistory();
    registerPrivateMessageHandler(recipientUser, handleIncomingPrivateMessage);

    return () => {
      isMounted = false;
      unregisterPrivateMessageHandler(recipientUser);
    };
  }, [currentUser, recipientUser, registerPrivateMessageHandler, unregisterPrivateMessageHandler]);

  if (loading) {
    return (
      <div className="private-chat-window">
        <div className="private-chat-header">
          <h3>{recipientUser}</h3>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="private-chat-window">
      <div className="private-chat-header">
        <div className="recipient-info">
          <div className="recipient-avatar">
            {recipientUser.charAt(0).toUpperCase()}
          </div>
          <h3>{recipientUser}</h3>
        </div>

        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="private-messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`private-message ${
                msg.sender === currentUser ? "own-message" : "received-message"
              }`}
            >
              <div className="message-header">
                <span
                  className="sender-name"
                  style={{ color: msg.color || "#6b73ff" }}
                >
                  {msg.sender === currentUser ? "You" : msg.sender}
                </span>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="private-message-input-container">
        <form onSubmit={sendPrivateMessage} className="private-message-form">
          <input
            type="text"
            placeholder={`Message ${recipientUser}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="private-message-input"
            maxLength={500}
          />

          <button
            type="submit"
            disabled={!message.trim()}
            className="private-send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivateChat;