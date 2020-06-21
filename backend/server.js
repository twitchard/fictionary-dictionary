import express from "express";
import { createServer } from "http";
import socketIo from "socket.io";
import { existsSync, statSync } from "fs";
import { page, wrap } from "./utils";
import low from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync";

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
  wrap(async (req, res) => {
    console.log(`serving ${req.path}`);
    console.log(fs.statSync("dist/index.html").size);
    while (!fs.existsSync("dist/index.html")) {
      await pause(200);
    }
    res.sendFile("index.html", { root: "dist" });
  })
);

http.listen(process.env.PORT, () => {
  console.error(
    "\nBackend restarted. Refresh the preview to see the changes.\n"
  );
});
// .on("upgrade", proxy.upgrade); // This is needed to make Parcel live-updates work on Glitch.
