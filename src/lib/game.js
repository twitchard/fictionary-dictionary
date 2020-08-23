const applyUpdates = require("immutability-helper");

const emptyWord = (id) => ({
  id,
  spelling: "",
  announced: false,
  revealed: true,
  deadline: "never",
  correctDefinition: "",
  votes: [],
  submissions: [],
});
exports.emptyWord = emptyWord

const expired = (now, defn) =>
  defn.deadline === "already" ||
  (defn.deadline !== "never" && now > defn.deadline);
const closeIfExpired = (now) => (defn) => ({
  ...defn,
  closed: expired(now, defn),
});

/*
const newGame = roomName => ({
  roomName,
  players: [],
  words: [emptyWord(uuid())]
});
*/
const uuid = () =>
  Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);

const emptyGame = () => ({
  roomName: "",
  players: [],
  chat: [],
  words: [],
});
exports.emptyGame = emptyGame
const newGame = (roomName) => ({
  roomName,
  players: [],
  chat: [],
  words: [
    // emptyWord(uuid()),
    // { ...emptyWord(uuid()), spelling: "foo", correctDefinition: "bar" },
    // {
    //   ...emptyWord(uuid()),
    //   spelling: "foo2",
    //   correctDefinition: "bar",
    //   announced: true,
    // },
    // {
    //   ...emptyWord(uuid()),
    //   spelling: "foo3",
    //   correctDefinition: "bar",
    //   announced: true,
    //   deadline: Date.now() + 1000 * 60 * 10,
    // },
    {
      ...emptyWord(uuid()),
      spelling: "foo4",
      correctDefinition: "bar",
      announced: true,
      deadline: Date.now() - 1000 * 60,
    },
  ],
});
exports.newGame = newGame

const addWordAction = () => ({
  shape: "addWord",
});
exports.addWordAction = addWordAction

const removeWordAction = (id) => ({
  shape: "removeWord",
  id,
});
exports.removeWordAction = removeWordAction

const updateWordAction = (id, spelling, correctDefinition) => ({
  shape: "updateWord",
  id,
  spelling,
  correctDefinition,
});
exports.updateWordAction = updateWordAction

const reorderWordsAction = (ids) => ({
  shape: "reorderWords",
  ids,
});
exports.reorderWordsAction = reorderWordsAction

const announceWordAction = (id) => ({
  shape: "announceWord",
  id,
});
exports.announceWordAction = announceWordAction

const unannounceWordAction = (id) => ({
  shape: "unannounceWord",
  id,
});
exports.unannounceWordAction = unannounceWordAction

const addPlayerAction = (name) => ({
  shape: "addPlayer",
  name,
});
exports.addPlayerAction = addPlayerAction

const submitDefinitionAction = (id, playerName, definition) => ({
  shape: "submitDefinition",
  id,
  playerName,
  definition,
});
exports.submitDefinitionAction = submitDefinitionAction

const sendChatAction = (playerName, text) => ({
  shape: "sendChat",
  playerName,
  text,
});
exports.sendChatAction = sendChatAction

const setDeadlineAction = (id, deadline) => ({
  shape: "setDeadline",
  id,
  deadline,
});
exports.setDeadlineAction = setDeadlineAction

const beginVotingAction = (id) => ({ shape: "beginVoting", id });
exports.beginVotingAction = beginVotingAction

const endVotingAction = () => ({ shape: "endVoting" });
exports.endVotingAction = endVotingAction

const numberWords = (x) => ({
  ...x,
  words: x.words.map((w, i) => ({ ...w, n: i + 1 })),
});

const onWord = (id, f, game) => {
  return {
    ...game,
    words: game.words.map((word) => (word.id === id ? f(word) : word)),
  };
};

const update = (game, action) => {
  if (action.shape === "addPlayer") {
    return applyUpdates(game, {
      players: { $push: [action.name] },
    });
  }

  if (action.shape === "deletePlayer") {
    return applyUpdates(game, {
      players: { $apply: (x) => x.filter((name) => name !== action.name) },
    });
  }

  if (action.shape === "addWord") {
    return applyUpdates(game, {
      words: { $push: [emptyWord(uuid())] },
    });
  }

  if (action.shape === "updateWord") {
    return applyUpdates(game, {
      words: {
        $set: game.words.map((w) =>
          w.id !== action.id
            ? w
            : {
                ...w,
                spelling: action.spelling,
                correctDefinition: action.correctDefinition,
              }
        ),
      },
    });
  }

  if (action.shape === "removeWord") {
    return applyUpdates(game, {
      words: {
        $apply: (words) => words.filter((w) => w.id !== action.id),
      },
    });
  }

  if (action.shape === "reorderWords") {
    return applyUpdates(game, {
      words: {
        $apply: (words) =>
          action.ids
            .map((id) => words.filter((x) => x.id === id)[0])
            .filter(Boolean),
      },
    });
  }

  if (action.shape === "announceWord") {
    return onWord(action.id, (w) => ({ ...w, announced: true }), game);
  }

  if (action.shape === "unannounceWord") {
    return onWord(action.id, (w) => ({ ...w, announced: false }), game);
  }

  if (action.shape === "submitDefinition") {
    return applyUpdates(game, {
      words: {
        $set: game.words.map((w) =>
          w.id !== action.id
            ? w
            : {
                ...w,
                submissions: [
                  ...w.submissions.filter(
                    (s) => s.playerName !== action.playerName
                  ),
                  {
                    playerName: action.playerName,
                    definition: action.definition,
                  },
                ].sort((a, b) => a.playerName.localeCompare(b.playerName)),
              }
        ),
      },
    });
  }

  if (action.shape === "sendChat") {
    return applyUpdates(game, {
      chat: {
        $push: [
          {
            text: action.text,
            playerName: action.playerName,
            timestamp: Date.now(),
          },
        ],
      },
    });
  }

  if (action.shape === "setDeadline") {
    return onWord(
      action.id,
      (w) => ({ ...w, deadline: action.deadline }),
      game
    );
  }

  if (action.shape === "beginVoting") {
    return applyUpdates(game, {
      voting: { $set: action.id },
    });
  }

  if (action.shape === "endVoting") {
    return applyUpdates(game, {
      voting: { $set: null },
    });
  }

  throw new Error("Unknown action " + action.shape);
};
exports.update = update

const sharedView = (game) => ({
  ...game,
  words: game.words.map(closeIfExpired(Date.now())),
});

const segmentSubmissions = (playerName, game) => ({
  ...game,
  words: game.words.map((w) => {
    const { submissions, ...rest } = w;
    const mySubmission = submissions.filter(
      (s) => s.playerName === playerName
    )[0];
    return { mySubmission, ...rest };
  }),
});

const hideUnannounced = (game) => ({
  ...game,
  words: game.words.filter((w) => w.announced),
});

const modView = (game) => sharedView(game);
exports.modView = modView

const playerView = (playerName) => (game) =>
  hideUnannounced(segmentSubmissions(playerName, sharedView(game)));
exports.playerView = playerView
