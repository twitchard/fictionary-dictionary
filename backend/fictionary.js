const modRoomName = (roomName) => `mod/${roomName}`;
const playerRoomName = (playerName) => (roomName) =>
  `player/${roomName}/${playerName}`;
const { newGame, modView, playerView, update } = require("../lib/game");

const getGame = async (db, roomName) => {
  const ret = await db.get("games").find({ roomName }).value();
  if (!ret) {
    throw new Error("no such game " + roomName);
  }
  return ret;
};

const getOrCreateGame = async (db, roomName) => {
  const game = await db.get("games").find({ roomName }).value();
  if (game) return game;
  const ret = newGame(roomName);
  await db.get("games").push(ret).write();
  return ret;
};

const updateGame = async (db, roomName, f) => {
  const game = await getGame(db, roomName);
  const ret = f(game);
  await db.get("games").remove({ roomName }).write();

  await db.get("games").push(ret).write();

  return ret;
};

const fictionary = (io, db) => {
  const nudge = async (roomName) => {
    const game = await getGame(db, roomName);
    io.to(modRoomName(roomName)).emit("update", modView(game));
    console.log(game.players);
    game.players.map((playerName) => {
      io.to(playerRoomName(playerName)(roomName)).emit(
        "update",
        playerView(playerName)(game)
      );
    });
  };

  const join = async (socket, view, namespaceRoom, roomName, game) => {
    socket.join(namespaceRoom(roomName));
    await nudge(roomName);
    socket.on("refresh", async () => {
      socket.emit("update", view(await getGame(db, roomName)));
    });
    const now = Date.now();
    socket.on("action", async (action) => {
      if (action.shape === "reset") {
        await updateGame(db, roomName, () => newGame(roomName, now));
      } else {
        const newGame = await updateGame(db, roomName, (game) =>
          update(game, action, now)
        );
        await nudge(roomName);
        socket.emit(`ack${action.action_id}`);
      }
    });
  };
  io.on("reconnect", () => {
    console.log("reconnect");
  });
  io.on("connection", (socket) => {
    console.log("connected");
    socket.on("connectAsMod", async ({ roomName }) => {
      const game = await getOrCreateGame(db, roomName);
      await join(socket, modView, modRoomName, roomName, game);
    });
    socket.on("connectAsPlayer", async ({ roomName, playerName }) => {
      await getOrCreateGame(db, roomName);
      const game = await updateGame(db, roomName, (game) => ({
        ...game,
        players: [
          ...game.players.filter((x) => x !== playerName),
          playerName,
        ].sort(),
      }));

      await join(
        socket,
        playerView(playerName),
        playerRoomName(playerName),
        roomName,
        game
      );
    });
  });
};
module.exports = {
  fictionary,
  updateGame,
  getGame,
};
