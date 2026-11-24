import { useEffect, useRef, useState } from "react";
import "./App.css";

type ChatMessage = {
  username: string;
  text: string;
  timestamp: number; // breaking news: timestamp is a number of milliseconds from Date.now()
};
function formatTime(time: number) {
  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState("");
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to server!");
      setConnected(true);
    };

    socket.onmessage = (event) => {
      let message: ChatMessage;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        message = {
          username: "Unknown",
          text: String(event.data),
          timestamp: Date.now(),
        };
      }

      setMessages((previous) => [...previous, message]);
    };

    socket.onclose = () => {
      console.log("Disconnected from server.");
      setConnected(false);
    };

    socket.onerror = () => console.log("WebSocket error.");

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  function sendMessage() {
    const socket = socketRef.current;

    if (!input.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    if (socket?.readyState !== WebSocket.OPEN) {
      setError("Cannot send: WebSocket not open.");
      return;
    }

    socket.send(
      JSON.stringify({
        username: username.trim() || "Unknown User",
        text: input.trim(),
        timestamp: Date.now(),
      }),
    );
    setInput("");
    setError("");
  }

  return (
    <div className="chat-container">
      <h1>WebSocket Chat</h1>
      <p>
        Status:{" "}
        <strong className={connected ? "connected" : "disconnected"}>
          {connected ? "Connected" : "Disconnected"}
        </strong>
      </p>
      <div className="username-input">
        <label>
          Your name:{" "}
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Unknown User"
          />
        </label>
      </div>
      <p>
        Messages Received: <strong>{messages.length}</strong>
      </p>
      <div className="messages">
        {messages.length === 0 && (
          <p className="empty">
            No messages yet. Open a second tab and say hello!
          </p>
        )}
        {messages.map((message, index) => (
          <p className="message" key={index}>
            <span className="timestamp">[{formatTime(message.timestamp)}]</span>{" "}
            <strong>{message.username}:</strong> {message.text}
          </p>
        ))}
      </div>
      <div className="message-input">
        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError("");
          }}
          placeholder="Type a message..."
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage} disabled={!connected}>
          Send
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;
