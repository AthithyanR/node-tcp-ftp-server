import { createServer, Socket } from "node:net";
import { stdin } from "node:process";
import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// types
type SocketData = {
  id: string;
};

type CustomSocket = Socket & { data: SocketData };

type ExitOptions = {
  exit?: boolean,
  cleanup?: boolean
}

const sockets = new Map<string, CustomSocket>();
const socketMsgs = new Map<string, string[]>();

// const rl = createInterface(stdin);
// rl.on("line", (line) => {
//   console.log(`sending ${line} to clients: `, sockets.size);

//   for (const [_id, sock] of sockets.entries()) {
//     sock.write(line + "\n");
//   }
// });

function addSocket(sock: CustomSocket) {
  sock.data = { id: randomUUID() };
  // add to collection
  sockets.set(sock.data.id, sock);
  sock.write("hello from server!\n")
}

function endSocket(sock: CustomSocket) {
  // remove from collection
  sockets.delete(sock.data.id);
  sock.end();
}

function handleSocket(sock: CustomSocket) {
  addSocket(sock);

  sock.on("data", (data) => {
    // buf to str
    const stringMsg = data.toString().slice(0, -2);
    // add non empty msgs to state
    if (stringMsg) {
      const msgState = socketMsgs.get(sock.data.id) || [];
      msgState.push(stringMsg);
      socketMsgs.set(sock.data.id, msgState);
    }
    console.log(stringMsg);
  });

  sock.on("close", () => endSocket(sock));
  sock.on("end", () => endSocket(sock));
  sock.on("error", (e) => {
    console.error("socket error: ", e);
    endSocket(sock);
  });
  sock.on("timeout", () => endSocket(sock));
}

const tcpServer = createServer();

tcpServer.on("close", () => console.log("tcpServer closed"));
tcpServer.on("connection", handleSocket);
tcpServer.on("drop", (e) => console.log("tcpServer drop", e));
tcpServer.on("error", (e) => console.error("tcpServer error", e));
tcpServer.on("listening", () =>
  console.log(`tcpServer listening on: ${JSON.stringify(tcpServer.address())}`)
);

tcpServer.listen(process.env.PORT || 6969);


// persist msg state as json
function exitCleanup() {
  writeFileSync(join(process.cwd(), "/data/data.json"), JSON.stringify(Object.fromEntries(socketMsgs)));
}
function exitHandler(opts: ExitOptions, _exitCode: string) {
  if (opts.cleanup) exitCleanup()
  if (opts.exit) process.exit();
}

process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGHUP', exitHandler.bind(null, { exit: true }));
process.on('SIGQUIT', exitHandler.bind(null, { exit: true }));
process.on('SIGTERM', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
process.on('exit', exitHandler.bind(null, { cleanup: true }));