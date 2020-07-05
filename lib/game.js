import applyUpdates from "immutability-helper";

export const emptyWord = (id) => ({
  id,
  spelling: "",
  announced: false,
  revealed: true,
  deadline: "never",
  correctDefinition: "",
  voteEvents: [],
  voteOffset: null,
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
export const newGame = (roomName, now) => ({
  created: now,
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
      deadline: now - 1000 * 60,
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

export const submitVoteAction = (id, playerName, definition) => ({
  shape: "submitVote",
  id,
  definition,
  playerName,
});

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

const handleAddPlayer = (game, action, time) => {
  if (action.shape !== "addPlayer") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    players: { $push: [action.name] },
  });
};

const handleDeletePlayer = (game, action, time) => {
  if (action.shape !== "deletePlayer") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    players: { $apply: (x) => x.filter((name) => name !== action.name) },
  });
};

const handleAddWord = (game, action, time) => {
  if (action.shape !== "addWord") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    words: { $push: [emptyWord(uuid())] },
  });
};

const handleUpdateWord = (game, action, time) => {
  if (action.shape !== "updateWord") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
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
};

const handleRemoveWord = (game, action, time) => {
  if (action.shape !== "removeWord") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    words: {
      $apply: (words) => words.filter((w) => w.id !== action.id),
    },
  });
};

const handleReorderWords = (game, action, time) => {
  if (action.shape !== "reorderWords") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    words: {
      $apply: (words) =>
        action.ids
          .map((id) => words.filter((x) => x.id === id)[0])
          .filter(Boolean),
    },
  });
};

const handleAnnounceWord = (game, action, time) => {
  if (action.shape !== "announceWord") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return onWord(action.id, (w) => ({ ...w, announced: true }), game);
};

const handleUnannounceWord = (game, action, time) => {
  if (action.shape !== "unannounceWord") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return onWord(action.id, (w) => ({ ...w, announced: false }), game);
};

const handleSubmitDefinition = (game, action, time) => {
  if (action.shape !== "submitDefinition") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
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
};

const handleSendChat = (game, action, time) => {
  if (action.shape !== "sendChat") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    chat: {
      $push: [
        {
          text: action.text,
          playerName: action.playerName,
        },
      ],
    },
  });
};

const handleSetDeadline = (game, action, time) => {
  if (action.shape !== "setDeadline") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return onWord(action.id, (w) => ({ ...w, deadline: action.deadline }), game);
};

const handleBeginVoting = (game, action, time) => {
  if (action.shape !== "beginVoting") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  const withVotingSet = applyUpdates(game, {
    voting: { $set: action.id },
  });
  const withOffsetSet = onWord(
    action.id,
    (w) =>
      w.voteOffset !== null
        ? w
        : { ...w, voteOffset: getVoteOffset(withVotingSet) },
    withVotingSet
  );
  return withOffsetSet;
};

const handleEndVoting = (game, action, time) => {
  if (action.shape !== "endVoting") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  return applyUpdates(game, {
    voting: { $set: null },
  });
};

const handleSubmitVote = (game, action, now) => {
  if (action.shape !== "submitVote") {
    throw new Error(`Unexpected action ${action.shape}`);
  }
  const event = {
    shape: "vote",
    playerName: action.playerName,
    definition: action.definition,
  };
  return onWord(
    action.id,
    (w) => ({
      ...w,
      voteEvents: [...w.voteEvents, event],
    }),
    game
  );
};
const updateHandlers = {
  addPlayer: handleAddPlayer,
  deletePlayer: handleDeletePlayer,
  addWord: handleAddWord,
  updateWord: handleUpdateWord,
  removeWord: handleRemoveWord,
  reorderWords: handleReorderWords,
  announceWord: handleAnnounceWord,
  unannounceWord: handleUnannounceWord,
  submitDefinition: handleSubmitDefinition,
  sendChat: handleSendChat,
  setDeadline: handleSetDeadline,
  beginVoting: handleBeginVoting,
  endVoting: handleEndVoting,
  submitVote: handleSubmitVote,
};

export const update = (game, action, time) => {
  const handler = updateHandlers[action.shape];
  if (!handler) {
    throw new Error(`Unknown action ${action.shape}`);
  }
  return handler(game, action, time);
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

export const getVoteOffset = (game) => {
  const { words } = game;
  return words.filter((w) => w.voteOffset !== null).length;
};
