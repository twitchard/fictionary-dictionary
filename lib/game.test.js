import * as Game from "./game";
import { newGame, emptyGame, emptyWord } from "./game";

const registerDescribes = (f) => {
  const described = [];

  const registeringDescribe = (target, thisArg, args) => {
    const [s, ...rest] = args;
    target.call(thisArg, s, ...rest);
    described.push(s);
  };

  const describeProxy = new Proxy(describe, {
    apply: registeringDescribe,
    get: (target, prop, receiver) => {
      return new Proxy(target[prop], {
        apply: registeringDescribe,
      });
    },
  });
  const getDescribed = () => described;
  return f(describeProxy, getDescribed);
};

const readyToVoteWordDefinition = (id, playerName) => `${id}By${playerName}`;
const readyToVoteWord = (id, playerNames) => ({
  ...emptyWord(id),
  spelling: id,
  correctDefinition: `correct${id}`,
  submissions: playerNames.map((playerName) => ({
    playerName,
    definition: readyToVoteWordDefinition(id, playerName),
  })),
});

describe("Game", () => {
  describe(".update", () => {
    const defaultTime = Number(new Date("2020-01-01"));
    const update = (game, action, time) =>
      Game.update(game, action, defaultTime || time);
    registerDescribes((describe, getDescribed) => {
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
        const action = Game.submitDefinitionAction(
          "foo",
          "fooPlayer",
          "fooDef"
        );
        it("adds another definition to the word", () => {
          const result = update(start, action);
          expect(result).toEqual({
            ...emptyGame(),
            words: [
              {
                ...emptyWord("foo"),
                submissions: [
                  { definition: "fooDef", playerName: "fooPlayer" },
                ],
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
        const foo = emptyWord("foo");
        const bar = { ...emptyWord("bar"), voteOffset: 0 };
        const start = {
          ...emptyGame(),
          words: [foo, bar],
        };
        const action = Game.beginVotingAction("foo");
        it("initiates voting on the specified word", () => {
          const result = update(start, action);
          expect(result).toEqual({
            ...start,
            voting: "foo",
            words: [{ ...foo, voteOffset: 1 }, bar],
          });
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

      describe("submitVote", () => {
        const players = ["alice", "bob"];
        const word = readyToVoteWord("foo", players);
        const start = {
          ...emptyGame(),
          players,
          words: [word],
        };
        const action = Game.submitVoteAction(
          "foo",
          "alice",
          readyToVoteWordDefinition("foo", "bob")
        );
        const expected = {
          ...start,
          words: [
            {
              ...word,
              voteEvents: [
                {
                  shape: "vote",
                  playerName: "alice",
                  definition: readyToVoteWordDefinition("foo", "bob"),
                },
              ],
            },
          ],
        };
        it("appends a vote event", () => {
          const result = update(start, action);
          expect(result).toEqual(expected);
        });
      });

      describe("all actions", () => {
        it("are covered by tests", () => {
          const allActionNames = Object.keys(Game)
            .filter((k) => /Action$/.test(k))
            .map((k) => k.split("Action")[0])
            .sort();

          const described = getDescribed();
          allActionNames.map((n) => expect(described).toContain(n));
        });
      });
    });
  });
  describe("getVoteOffset", () => {
    it("is 0 when no games have started voting", () => {
      expect(Game.getVoteOffset(emptyGame())).toEqual(0);
      expect(
        Game.getVoteOffset({ ...emptyGame(), words: [emptyWord("foo")] })
      ).toEqual(0);
    });
    it("is 1 when a single games has started voting", () => {
      expect(
        Game.getVoteOffset({
          ...emptyGame(),
          words: [{ ...emptyWord("bar"), voteOffset: 0 }],
        })
      ).toEqual(1);
      expect(
        Game.getVoteOffset({
          ...emptyGame(),
          words: [
            { ...emptyWord("bar"), voteOffset: 0 },
            { ...emptyWord("baz"), voteOffset: null },
          ],
        })
      ).toEqual(1);
    });
  });
});
