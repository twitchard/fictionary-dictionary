import applyUpdates from "immutability-helper";
export const emptyWord = (id) => ({
  id,
  spelling: "",
  announced: false,
  revealed: true,
  deadline: "never",
  correctDefinition: "",
  votes: [],
  submissions: [],
});

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

export const emptyGame = () => ({
  roomName: "",
  players: [],
  chat: [],
  words: [],
});
export const newGame = (roomName) => ({
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

export const addWordAction = () => ({
  shape: "addWord",
});

export const removeWordAction = (id) => ({
  shape: "removeWord",
  id,
});

export const updateWordAction = (id, spelling, correctDefinition) => ({
  shape: "updateWord",
  id,
  spelling,
  correctDefinition,
});

export const reorderWordsAction = (ids) => ({
  shape: "reorderWords",
  ids,
});

export const announceWordAction = (id) => ({
  shape: "announceWord",
  id,
});

export const unannounceWordAction = (id) => ({
  shape: "unannounceWord",
  id,
});

export const addPlayerAction = (name) => ({
  shape: "addPlayer",
  name,
});

export const submitDefinitionAction = (id, playerName, definition) => ({
  shape: "submitDefinition",
  id,
  playerName,
  definition,
});

export const sendChatAction = (playerName, text) => ({
  shape: "sendChat",
  playerName,
  text,
});

export const setDeadlineAction = (id, deadline) => ({
  shape: "setDeadline",
  id,
  deadline,
});

export const beginVotingAction = (id) => ({ shape: "beginVoting", id });

export const endVotingAction = () => ({ shape: "endVoting" });

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

export const update = (game, action) => {
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
export const modView = (game) => sharedView(game);
export const playerView = (playerName) => (game) =>
  hideUnannounced(segmentSubmissions(playerName, sharedView(game)));
