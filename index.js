const Express = require("express");
const fs = require("fs");
const p = require("path");
const { Server } = require("socket.io");
const http = require("http");
const { createTerminalInterface } = require("./terminal");
const Counter = require("./counter");
const app = Express();
const server = http.createServer(app).listen(3015);
const { instrument } = require("@socket.io/admin-ui");
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io", "http://localhost:3000"],
    credentials: true,
  },
});
instrument(io, { auth: false });
const config = require("./config.json");

app.use(Express.static("./web/build"));

const interface = createTerminalInterface(io);

if (!fs.existsSync(p.join(__dirname, "data"))) {
  fs.mkdirSync(p.join(__dirname, "data"));
}
const dataDir = fs
  .readdirSync(p.join(__dirname, "data"), { withFileTypes: true })
  .filter((dir) => dir.isFile());

dataDir.forEach((dataFile) => {
  if (!dataFile.name.endsWith(".json")) return;
  const data = require(`./data/${dataFile.name}`);
  const name = data?.name ?? dataFile.name.replace(".json", "");

  const ctr = new Counter(name, io);

  console.log(`Created counter: ${ctr.name}`);
});

io.on("connection", (socket) => {
  socket.emit("HELLO", {
    counters: Counter.counters.keys(),
    name: config.instanceName,
    motd: config.motd,
  });
  socket.on("counters", (ack) => {
    ack({ counters: Array.from(Counter.counters.keys()) });
  });
  socket.on("config", (ack) => {
    ack({ name: config.instanceName, motd: config.motd });
  });

  socket.on("subscribe", (ctr, ack) => {
    // check if exists
    const counter = Counter.get(ctr);
    if (!counter) ack(false);

    socket.join(counter.name);
    ack(true);
  });
  socket.on("unsubscribe", (ctr, ack) => {
    socket.leave(ctr);
    ack(true);
  });

  socket.on("time", (ctr, ack) => {
    const counter = Counter.get(ctr);
    if (!counter) ack(false);

    ack(counter.metadata());
  });
});

console.log(`Ready!`);
