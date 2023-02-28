import { createServer, Socket } from "node:net";

const tcpServer = createServer();

tcpServer.on("close", () => console.log("tcpServer closed"))
tcpServer.on("connection", (sock: Socket) => {
    setInterval(() => sock.write("Hello there!\n"), 1000);
})
tcpServer.on("drop", (e) => console.log("tcpServer drop", e))
tcpServer.on("error", (e) => console.log("tcpServer error", e))
tcpServer.on("listening", () => console.log(`tcpServer listening on: ${JSON.stringify(tcpServer.address())}`))

tcpServer.listen(process.env.PORT || 6969);
