const low = require("lowdb");
const FileAsync = require("lowdb/adapters/FileAsync");
const adapter = new FileAsync("test-db.json");

const { updateGame, getGame } = require("./fictionary");
const { expect } = require("chai");

describe("fictionary", () => {
  describe("updateGame", () => {
    let db;
    before(async () => {
      db = (await low(adapter)).defaults({ games: [] });
    });
    beforeEach(() => {
      return db.get("games").remove();
    });
    it("updates", async () => {
      await db
        .get("games")
        .push({ roomName: "foo" })
        .write();
      await updateGame(db, "foo", () => ({ roomName: "foo", bar: "baz" }));
      const game = await getGame(db, "foo");
      expect(game.bar).to.equal("baz");
    });
  });
});
