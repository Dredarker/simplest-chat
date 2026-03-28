// ================================================================
//
//            ATTENTION: MESSAGES ARE NOT ENCRYPTED
//                     AND IP IS LOGGING
//
// ================================================================

const CSS_RED = 'style="color:red"';
const CSS_CYAN = 'style="color:cyan"';
const CSS_GREEN = 'style="color:green"';

const WSCHATPREFIX = `<b ${CSS_GREEN}>[INT-ED CHAT]</b>`;

try {var chatBtn = document.getElementById("chat-send");} catch {writeChat(`<b style="color:RGB(200,0,0)">Detected using the ShrekDark</b>`)}
try {var username = document.getElementsByClassName("user")[0].innerText} catch {}
let drederwschat;

writeChat(`<b style="font-size:30px; color:red">Hi from intergrated chat!`);
writeChat(`<i>Thanks for connecting to intergrated chat by Dreder! To start talk, say '*something' where something - your message to send</i>`);
writeChat(`<i>(Warning: The messages is not encrypted and ip is logging to admin)</i>`);
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
            let encrypted = "";
            for (let i = 0; i < last_arg.length; i++) {
                encrypted = encrypted + String.fromCodePoint(last_arg.codePointAt(i)+10);
            }
            sendWS({
                type: "broadcast",
                text: encrypted
            });
        }
    } else if (value.startsWith("!")) {
        writeChat(`${WSCHATPREFIX} <i ${CSS_RED}">Invalid local command "${value}"</i>`);
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
            let sendByServer = false;
            sendByServer = data.from === undefined;
            let decrypted = "";
            if (!sendByServer) {
                for (let i = 0; i < data.text.length; i++) {
                    decrypted = decrypted + String.fromCodePoint(data.text.codePointAt(i)-10);
                }
            }
            writeChat(`${WSCHATPREFIX} ${sendByServer ? "" : data.from+": "}${sendByServer ? data.text : decrypted}`);
        } else if (data.type === "getclients") {
            writeChat(`${WSCHATPREFIX} ${String(JSON.stringify(data.text))}`);
        } else if (data.type === "error") {
            if (data.reason === "ip-ban") {
                writeChat(`<p ${CSS_RED}>${WSCHATPREFIX} Что-ш, поздравляю. Ты в нашем бане.</p>`);
                writeChat("<img src='https://banya-zhivica.ru/images/landscape/slide3.jpg' style='width: 150px;'>");
            }
        }
    };
    drederwschat.onclose = function(event) {
        if (event.wasClean) {
            writeChat(`${WSCHATPREFIX} Connection is closed (${event.code})`);
        } else {
            writeChat(`${WSCHATPREFIX} Connection is broken`);
        }
        writeChat(`${WSCHATPREFIX} If you want to connect again, say '!connectws'`);
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
