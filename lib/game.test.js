import * as Game from "./game";
import { newGame, emptyGame, update, emptyWord } from "./game";
describe("Game", () => {
  describe(".update", () => {
    describe("addWord", () => {
      const start = emptyGame();
      const action = Game.addWordAction();
      it("adds an empty word to the game", () => {
        const result = update(start, action);
        expect(result.words.length).toEqual(1);
        expect(result.words).toEqual([emptyWord(result.words[0].id)]);
      });
    });

    describe("removeWord", () => {
      const start = {
        ...emptyGame(),
        words: [emptyWord("foo"), emptyWord("bar")],
      };
      const action = Game.removeWordAction("bar");
      it("removes the specified definition from the game", () => {
        const result = update(start, action);
        expect(result.words.length).toEqual(1);
        expect(result.words[0]).toEqual(emptyWord("foo"));
      });
    });

    describe("updateWord", () => {
      const start = {
        ...emptyGame(),
        words: [emptyWord("foo")],
      };
      const action = Game.updateWordAction("foo", "bar", "baz");
      it("changes the spelling and definition of the specified word", () => {
        const result = update(start, action);
        expect(result.words.length).toEqual(1);
        expect(result.words[0]).toEqual({
          ...emptyWord("foo"),
          correctDefinition: "baz",
          spelling: "bar",
        });
      });
    });

    describe("reorderWords", () => {
      const foo = { ...emptyWord("foo"), spelling: "one" };
      const bar = { ...emptyWord("bar"), spelling: "two" };
      const baz = { ...emptyWord("baz"), spelling: "three" };
      const qux = { ...emptyWord("qux"), spelling: "four" };
      const quux = { ...emptyWord("quux"), spelling: "five" };
      const start = {
        ...emptyGame(),
        words: [foo, bar, baz, qux, quux],
      };
      const action = Game.reorderWordsAction([
        "baz",
        "qux",
        "quux",
        "bar",
        "foo",
      ]);
      it("reorders the words", () => {
        const result = update(start, action);
        expect(result.words).toEqual([baz, qux, quux, bar, foo]);
      });
    });

    describe("announceWord", () => {
      const start = {
        ...emptyGame(),
        words: [emptyWord("bar"), emptyWord("foo")],
      };
      const action = Game.announceWordAction("foo");
      it("changes the word to announced", () => {
        const result = update(start, action);
        expect(result).toEqual({
          ...emptyGame(),
          words: [emptyWord("bar"), { ...emptyWord("foo"), announced: true }],
        });
      });
    });

    describe("unannounceWord", () => {
      const start = {
        ...emptyGame(),
        words: [{ ...emptyWord("bar"), announced: true }, emptyWord("foo")],
      };
      const action = Game.unannounceWordAction("bar");
      it("changes the word to not be announced", () => {
        const result = update(start, action);
        expect(result).toEqual({
          ...emptyGame(),
          words: [emptyWord("bar"), emptyWord("foo")],
        });
      });
    });

    describe("addPlayer", () => {
      const start = emptyGame();
      const action = Game.addPlayerAction("fooPlayer");
      const action2 = Game.addPlayerAction("barPlayer");
      it("adds a new player to the game", () => {
        const result = update(update(start, action), action2);
        expect(result).toEqual({
          ...emptyGame(),
          players: ["fooPlayer", "barPlayer"],
        });
      });
    });

    describe("submitDefinition", () => {
      const start = { ...emptyGame(), words: [emptyWord("foo")] };
      const action = Game.submitDefinitionAction("foo", "fooPlayer", "fooDef");
      it("adds another definition to the word", () => {
        const result = update(start, action);
        expect(result).toEqual({
          ...emptyGame(),
          words: [
            {
              ...emptyWord("foo"),
              submissions: [{ definition: "fooDef", playerName: "fooPlayer" }],
            },
          ],
        });
      });
    });

    describe("sendChat", () => {
      const start = { ...emptyGame() };
      const action = Game.sendChatAction("fooPlayer", "fooMsg");
      it("adds a chat message to the game", () => {
        const result = update(start, action);
        expect(result.chat.length).toEqual(1);
        expect(result.chat).toEqual([
          {
            playerName: "fooPlayer",
            text: "fooMsg",
            timestamp: result.chat[0].timestamp,
          },
        ]);
      });
    });

    describe("setDeadline", () => {
      const start = { ...emptyGame(), words: [emptyWord("foo")] };
      const action = Game.setDeadlineAction("foo", 2);
      it("sets a deadline on the specified word", () => {
        const result = update(start, action);
        expect(result.words[0]).toEqual({
          ...emptyWord("foo"),
          deadline: 2,
        });
      });
    });

    describe("beginVoting", () => {
      const start = { ...emptyGame(), words: [emptyWord("foo")] };
      const action = Game.beginVotingAction("foo");
      it("initiates voting on the specified word", () => {
        const result = update(start, action);
        expect(result).toEqual({ ...start, voting: "foo" });
      });
    });

    describe("endVoting", () => {
      const start = { ...emptyGame(), words: [emptyWord("foo")] };
      const action = Game.endVotingAction();
      it("suspends voting", () => {
        const result = update(start, action);
        expect(result).toEqual({ ...start, voting: null });
      });
    });
  });
});
