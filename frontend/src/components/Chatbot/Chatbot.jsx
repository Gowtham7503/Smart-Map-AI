import { useEffect, useRef, useState } from "react";
import { getChatbotRecommendations } from "../../services/api";
import "./Chatbot.css";

const QUICK_PROMPTS = [
  "Famous places nearby",
  "Restaurants around here",
  "Temples nearby",
];

const Chatbot = ({
  locationLabel,
  mapPosition,
  onClose,
  onPlaceSelect,
}) => {
  const [messages, setMessages] = useState([
    {
      text: "Hi! I can recommend restaurants, temples, cafés, parks, museums, and famous places near the map.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (messageText = input) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || loading) return;

    setMessages((previousMessages) => [
      ...previousMessages,
      { text: trimmedMessage, sender: "user" },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await getChatbotRecommendations(
        trimmedMessage,
        mapPosition,
        locationLabel,
      );
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          text: response.data.reply,
          sender: "bot",
          recommendations: response.data.recommendations || [],
        },
      ]);
    } catch (error) {
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          text:
            error.response?.data?.reply ||
            error.response?.data?.error ||
            "I could not load nearby recommendations. Please try again.",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-title-badge">AI</span>
          <div>
            <strong>SmartChat</strong>
            <p>Your local guide</p>
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
        {messages.map((message, index) => (
          <div key={index} className={`chatbot-message ${message.sender}`}>
            <span>{message.text}</span>
            {message.recommendations?.length > 0 && (
              <div className="chatbot-recommendations">
                {message.recommendations.map((place) => (
                  <button
                   className="chatbot-place-card"
                    key={`${place.name}-${place.latitude}-${place.longitude}`}
                    onClick={() => onPlaceSelect(place)}
                    type="button"
                  >
                    <strong>{place.name}</strong>
                    <span>{place.description}</span>
                    <small>{place.distance_km} km away</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chatbot-message bot chatbot-typing">
            Finding nearby places…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="chatbot-quick-prompts">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Ask for nearby places..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button
          className="chatbot-send-btn"
          onClick={() => sendMessage()}
          type="button"
          aria-label="Send message"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
