const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// создаём WebSocket сервер
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

// храним клиентов
const clients = new Set();

wss.on("connection", (ws) => {
  console.log(`Client connected`);

  clients.add(ws);

  // обработка сообщений
  ws.on("message", (message) => {
    console.log(JSON.stringify(ws) + message.toString());

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
