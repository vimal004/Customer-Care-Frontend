import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
} from "@mui/material";
import io from "socket.io-client";

const socket = io("https://e-shop-ws.onrender.com"); // Replace with your WebSocket server URL

const App = () => {
  const [assignedClient, setAssignedClient] = useState(null); // Store assigned client ID
  const [messages, setMessages] = useState([]); // Store messages between executive and client
  const [input, setInput] = useState(""); // Input for chat message

  useEffect(() => {
    // Register as an executive
    socket.emit("registerExecutive");

    // Listen for client assignment
    socket.on("clientAssigned", (clientId) => {
      console.log(`Assigned client: ${clientId}`);
      setAssignedClient(clientId);
      setMessages([]); // Reset the message history for the new client
      console.log(`Assigned client: ${clientId}`);
    });

    // Listen for messages from the client
    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for client disconnection
    socket.on("clientDisconnected", (clientId) => {
      if (clientId === assignedClient) {
        setAssignedClient(null); // Remove the assigned client
        setMessages([]); // Clear the messages
        console.log(`Client ${clientId} disconnected`);
      }
    });

    // Cleanup on component unmount
    return () => {
      socket.off("clientAssigned");
      socket.off("message");
      socket.off("clientDisconnected");
    };
  }, [assignedClient]);

  // Send a message to the assigned client
  const sendMessage = () => {
    if (input.trim() && assignedClient) {
      const executiveMessage = { role: "executive", content: input };
      setMessages((prev) => [...prev, executiveMessage]); // Add message to local state
      console.log(executiveMessage);
      socket.emit("message", executiveMessage); // Send message to server
      setInput(""); // Clear input field
    }
    console.log("No client assigned");  
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4">Executive Dashboard</Typography>
      <Box sx={{ mt: 2, mb: 2 }}>
        {assignedClient ? (
          <Typography variant="h6">
            Chat with Client: {assignedClient}
          </Typography>
        ) : (
          <Typography variant="h6">Waiting for client assignment...</Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: 400,
          border: "1px solid #ccc",
          borderRadius: 2,
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", padding: 2 }}>
          {messages.length > 0 ? (
            <List>
              {messages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    textAlign: msg.role === "executive" ? "right" : "left",
                    backgroundColor:
                      msg.role === "executive" ? "#e0f7fa" : "#f1f8e9",
                    borderRadius: 1,
                    marginBottom: 1,
                    padding: 1,
                  }}
                >
                  <Typography variant="body1">
                    <strong>
                      {msg.role === "executive" ? "You: " : "Client: "}
                    </strong>
                    {msg.content}
                  </Typography>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", color: "#999" }}
            >
              No messages yet
            </Typography>
          )}
        </Box>

        {/* Chat input */}
        <Box sx={{ padding: 2, display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button variant="contained" color="primary" onClick={sendMessage}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default App;
