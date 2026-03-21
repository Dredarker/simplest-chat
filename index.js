const WebSocket = require("ws");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
const socket = new WebSocket("wss://simplest-chat.onrender.com");

socket.onopen = () => {
  console.log("Connected");
};

socket.onmessage = (event) => {
  console.log("Message:", event.data);
};`);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// создаём WebSocket сервер
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

// храним клиентов
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");

  clients.add(ws);

  // обработка сообщений
  ws.on("message", (message) => {
    console.log("Received:", message.toString());

    // рассылаем всем клиентам
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    }
  });

  // отключение клиента
  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (err) => {
    console.error("Error:", err);
  });
});
