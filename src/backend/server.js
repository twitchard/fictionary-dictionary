const express =require("express");
const { createServer } = require("http");
const socketIo = require("socket.io");
const { existsSync, statSync } = require("fs");
const low = require("lowdb");
const FileAsync = require("lowdb/adapters/FileAsync");

const app = express();
const http = createServer(app);
const io = socketIo(http);

//const { pause, proxyParcelHMR, wrap } = require("./utils");

//const proxy = proxyParcelHMR(app);

const adapter = new FileAsync("db.json");
const db = low(adapter);

const { fictionary } = require("./fictionary");
low(adapter)
  .then((db) => fictionary(io, db.defaults({ games: [] })))
  .catch((e) => {
    throw new Error(e);
  });

app.use(express.static("dist"));
app.get(
  "*",
  (req, res) => {
    res.sendFile("index.html", { root: "dist" });
  }
);

http.listen(process.env.PORT, () => {
  console.error(
    "\nBackend restarted. Refresh the preview to see the changes.\n"
  );
});
// .on("upgrade", proxy.upgrade); // This is needed to make Parcel live-updates work on Glitch.
