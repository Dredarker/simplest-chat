const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3000;

const client_module = () => {
// ================================================================
//
//            ATTENTION: MESSAGES ARE NOT ENCRYPTED
//
// ================================================================
try {const LOCALCHAT_PREFIX = `<b style="color:cyan">[LOCAL CHAT]</b>`} catch {}
const WSCHATPREFIX = `<b style="color:green">[INT-ED CHAT]</b>`;
try {var chatBtn = document.getElementById("chat-send");} catch {writeChat(`<b style="color:RGB(200,0,0)">Detected using the ShrekDark</b>`)}
try {var username = document.getElementsByClassName("user")[0].innerText} catch {}
let drederwschat;

writeChat(`<b style="font-size:30px; color:red">Hi from intergrated chat!`);
writeChat(`<i>Thanks for connecting to intergrated chat by Dreder! To start talk, say '*something' where something - your message to send</i>`);
writeChat(`<i>(Warning: The messages is not encrypted)</i>`);
const secondchatinput = document.getElementById("chat-input").cloneNode(false);
secondchatinput.id = "chat-input2";
secondchatinput.addEventListener('keydown', function(event) {
    if (event.code == 'Enter') {
        event.preventDefault();
        let value = secondchatinput.value;
        localChat(value);
        secondchatinput.value = "";
        document.getElementById("chat-close").click();
    }
});
secondchatinput.style = `
    width: 100%;
    background: none;
    color: white;
    border: 2px solid white;
    box-sizing: border-box;
    padding: 2px;
    font-size: 16pt;
`;
document.getElementById("chat-input").style = "display: none";
document.getElementById("chat-input").after(secondchatinput);

// Key binds
addEventListener("keydown", () => {
    switch (event.code) {
        case "Enter":
            setTimeout(() => {
                if (!document.getElementById("chat-content").classList.contains('closed')) {
                    secondchatinput.focus();
                }
            }, 50);
            break;
    }
});

connectToDredersWS();

function localChat(value) {
    let args = value.split(' ');
    if (args[0] === "!connectws") {
        if (drederwschat.readyState === 3) {
            connectToDredersWS();
        } else if (drederwschat.readyState === 2) {
            writeChat("Wait to fully close the connection!");
        } else if (drederwschat.readyState === 1) {
            writeChat("You're already connected!");
        } else if (drederwschat.readyState === 0) {
            writeChat("You're already connecting!");
        }
    } else if (args[0].startsWith("*")) {
        if (args[0] === '*') {
            if (args[1] === 'getclients') sendWS({type: "getclients"});
        } else {
            let last_arg = args.join(' ');
            last_arg = last_arg.slice(1);
            sendWS({
                type: "broadcast",
                text: last_arg
            });
        }
    } else if (value.startsWith("!")) {
        writeChat(`${LOCALCHAT_PREFIX} <i style="color:red">Invalid local command "${value}"</i>`);
    } else {
        sendChat(value);
    }
}

function connectToDredersWS() {
    drederwschat = new WebSocket("wss://simplest-chat.onrender.com");
    writeChat(`${WSCHATPREFIX} Connecting to chat server...`);
    drederwschat.onopen = function(e) {
        writeChat(`${WSCHATPREFIX} Connected to chat server`);
    };
    drederwschat.onmessage = function(event) {
        data = JSON.parse(event.data);
        if (data.type === "message") {
            writeChat(`${WSCHATPREFIX} ${data.from === undefined ? "" : data.from+": "}${data.text}`);
        } else if (data.type === "getclients") {
            writeChat(`${WSCHATPREFIX} ${data.text} ${data.text === 1 ? "client" : "clients"} in chat`);
        }
    };
    drederwschat.onclose = function(event) {
        if (event.wasClean) {
            writeChat(`${WSCHATPREFIX} Connection is closed (${event.code})`);
            writeChat(`${WSCHATPREFIX} If you want to connect again, say '!wschatconnect'`);
        } else {
            writeChat(`${WSCHATPREFIX} Connection is broken`);
        }
    };
    drederwschat.onerror = function(error) {
        writeChat(`${WSCHATPREFIX} Connection is corrupted: ${error}`);
    };
}

function writeChat(html = "Written Message", timems = 15000) {
    timems = timems ?? 15000;
	const p = document.createElement("p");
	p.className = "recent";
	p.innerHTML = html;
	document.getElementById("chat-content").append(p);
	setTimeout(() => {
		p.classList.remove("recent");
	}, timems);
	return p;
}

function sendChat(message) {
    if (document.getElementById("chat-content").classList.contains('closed')) chatBtn.click();
    document.getElementById("chat-input").value = message;
    chatBtn.click();
}

function sendWS(object) {
    drederwschat.send(JSON.stringify(object));
}
}

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(client_module);
  }
});
const wss = new WebSocket.Server({ port: PORT });

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
