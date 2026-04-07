import { useState } from "react";
import "./Chatbot.css";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { text: "Hi there. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "I am working on that for you.", sender: "bot" },
      ]);
    }, 500);

    setInput("");
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-title-badge">AI</span>
          <div>
            <strong>SmartChat</strong>
            <p>Your route assistant</p>
          </div>
        </div>
        <button
          className="chatbot-close-btn"
          onClick={onClose}
          type="button"
          aria-label="Close chatbot"
        >
          x
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chatbot-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="chatbot-send-btn"
          onClick={sendMessage}
          type="button"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
