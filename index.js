const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3000;
let client_module;
let a = fetch("https://raw.githubusercontent.com/Dredarker/simplest-chat/refs/heads/main/client_module.txt")
    .then((b) => b.text())
    .then((c) => client_module = c);

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(client_module);
  }
});
const wss = new WebSocket.Server({ server });

console.log(`WebSocket server started on port ${PORT}`);

// Map: clientId -> ws
const clients = new Map();

wss.on("connection", (ws) => {
  const clientId = uuidv4().slice(0, 7);

  // сохраняем клиента
  clients.set(clientId, ws);

  console.log(`Client connected: ${clientId}`);
  for (const [id, client] of clients.entries()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: "message",
        text: `${clientId} connected`
      }));
    }
  }
  // отправляем клиенту его ID
  ws.send(JSON.stringify({
    type: "init",
    clientId
  }));

  ws.on("message", (message) => {
    let data;

    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    // === типы сообщений ===

    // 1. Сообщение всем
    if (data.type === "broadcast") {
      for (const [id, client] of clients.entries()) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "message",
            from: clientId,
            text: data.text
          }));
        }
      }
    }

    // 2. Личное сообщение
    if (data.type === "private") {
      const target = clients.get(data.to);

      if (target && target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify({
          type: "message",
          from: clientId,
          text: data.text
        }));
      }
    }

    // 3. Все клиенты
    if (data.type === "getclients") {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "getclients",
          text: clients
        }));
      }
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${clientId}`);
    clients.delete(clientId);
    for (const [id, client] of clients.entries()) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "message",
            text: `${clientId} disconnected`
          }));
        }
      }
  });

  ws.on("error", (err) => {
    console.error(`Error (${clientId}):`, err);
  });
});

server.listen(PORT, () => {
  console.log("Server running on port ", PORT);
});
