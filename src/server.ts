import { createServer, Socket } from "node:net";
import { stdin } from "node:process";
import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";

type SocketData = {
  id: string;
};
type CustomSocket = Socket & { data: SocketData };

const sockets = new Map<string, CustomSocket>();

const rl = createInterface(stdin);
rl.on("line", (line) => {
  console.log(`sending ${line} to clients: `, sockets.size);

  for (const [_id, sock] of sockets.entries()) {
    sock.write(line + "\n");
  }
});

// play
// https.request({
//   host: "www.stackoverflow.com",
//   method: "GET",
//   path: "/questions/38533580/nodejs-how-to-promisify-http-request-reject-got-called-two-times"
// }, (resp) => {
//   resp.on('data', (chunk) => sock.write(chunk));
//   resp.on('end', () =>   sock.end())
// }).end()
// const rs = createReadStream(path.join(process.cwd(), "/src/server.ts"));
// rs.on("data", (chunk) => sock.write(chunk));
// rs.on("end", () => sock.write("hello from server!\n"));

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
    console.log(data.toString());
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
