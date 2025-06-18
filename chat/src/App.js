import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // get trade data 

  useEffect(() => {
    // fetch trades data from flask backend
    fetch("/api/trades")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setTrades(data);
          console.log('got trades');

        } else {
          console.error("Error loading trades:", data.error);
        }
        setLoadingTrades(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoadingTrades(false);
      });
  }, []);

  console.log(trades);
  console.log(loadingTrades);
  // when asking new question, show that one at the bottom

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate greeting prompt on first load
  useEffect(() => {
    fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_first: true }),
    })
      .then(res => res.json())
      .then(data => {
        setMessages([{ sender: "bot", text: data.answer }]);
      });
  }, []);

  // message to send question to API
  const sendMessage = async () => {
    const question = input.trim();
    if (!question) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { sender: "bot", text: "Error: " + data.error }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: data.answer }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Failed to connect to the backend." }]);
    }

    setLoading(false);
  };

  // detect when something is typed in box

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="App" >
      <h1 className='gradient-title' style={{ textAlign: "center" }}>TradeBot</h1>
      <div className="chat-window">
        {messages.length === 0 && !loading && (
          <div className="chat-loading"></div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}>
            <div className="chat-bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-message bot">
            <div className="chat-bubble">...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className='submit-question'>
        <textarea rows={2} placeholder="Type your question and press Enter..." value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
          className="chat-input"
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="chat-send-button">
          <span className="arrow">➤</span>
        </button>

      </div>




      {/* Display trade data table below chat */}
      <div style={{ marginTop: "2rem",
        maxWidth: "90vw",
        minHeight: '300px',
        maxHeight: "400px",        // limit max height
        overflowX: "auto",        // scroll horizontally if needed
        overflowY: "auto",        // scroll vertically if needed
        backgroundColor: "white",
        padding: '1rem',
        border: "1px solid black", }}>
        <h3 style = {{color:'black'}}>Trade Sample Data</h3>
        {loadingTrades ? (
          <p>Loading trade data...</p>
        ) : trades.length === 0 ? (
          <p>No trade data available.</p>
        ) : (
          <table
            border="1"
            cellPadding="5"
            cellSpacing="0"
            style={{ borderStyle: 'dotted', borderColor: 'white', borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                {Object.keys(trades[0]).map((key) => (
                  <th key={key} style={{ backgroundColor: "#eee" }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
