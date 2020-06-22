/** @jsx jsx */
import React, { useState, useEffect } from "react";
import {
  Heading,
  Label,
  Flex,
  Input,
  Textarea,
  Button,
  Box,
  Text,
  Alert,
  NavLink,
  Card,
  Select,
  Divider,
  jsx,
} from "theme-ui";

import {
  addWordAction,
  updateWordAction,
  removeWordAction,
  announceWordAction,
  revealWordAction,
  hideWordAction,
  reorderWordsAction,
  setDeadlineAction,
  sendChatAction,
  beginVotingAction,
  stopVotingAction,
} from "../lib/game";

import { Chat } from "./Chat";

import { useCountdown } from "./Countdown";
import DragList from "./DragList";
import CopyLink from "./CopyLink";
const connectToServer = (
  io,
  roomName,
  setGame,
  setError,
  setController,
  setSocket
) => {
  const socket = io();
  setSocket(socket);
  socket.on("disconnect", () => {
    console.log("disconnected...");
  });
  socket.on("reconnect", () => {
    socket.emit("connectAsMod", { roomName });
    console.log("reconnected");
  });
  socket.on("reconnect_attempt", () => {
    console.log("reconnecting...");
  });
  socket.once("connect", () => {
    window.addEventListener("beforeunload", () => {
      socket.close();
    });
    socket.emit("connectAsMod", { roomName });
    socket.on("update", (game) => {
      console.log("got game");
      setGame(game);
    });
    socket.once("update", () => {
      const emit = (action, callback) => {
        const uuidish = Math.floor(
          Math.random() * Number.MAX_SAFE_INTEGER
        ).toString(36);
        console.log("emitting...", action);
        const action_id = `${uuidish}`;
        socket.emit("action", { ...action, action_id });
        if (callback) socket.once(`ack${action_id}`, callback);
      };
      return setController({
        addWord: (callback) => {
          emit(addWordAction(), callback);
        },
        updateWord: (id, spelling, definition, callback) => {
          emit(updateWordAction(id, spelling, definition), callback);
        },
        removeWord: (id, callback) => {
          emit(removeWordAction(id), callback);
        },
        announceWord: (id, callback) => {
          emit(announceWordAction(id), callback);
        },
        reorderWords: (ids, callback) => {
          emit(reorderWordsAction(ids), callback);
        },
        sendChat: (text, callback) => {
          emit(sendChatAction("moderator", text), callback);
        },
        setDeadline: (id, expiry, callback) => {
          console.log("expiry", expiry);
          emit(setDeadlineAction(id, expiry * 1000 + Date.now()), callback);
        },
        reopenSubmissions: (id, callback) => {
          emit(setDeadlineAction(id, "never"), callback);
        },
        beginVoting: (id, callback) => {
          emit(beginVotingAction(id), callback);
        },
        stopVoting: (callback) => {
          emit(stopVotingAction(), callback);
        },
      });
    });
  });
};

const WordCard = ({ n, id, ...rest }) => {
  return (
    <Card
      m={2}
      p={3}
      sx={{
        borderRadius: `sketchy${id % 5}`,
      }}
      {...rest}
    ></Card>
  );
};

const usePoll = (interval, f, deps = []) => {
  const [state, setState] = useState(f());
  let int;
  useEffect(() => {
    int = setInterval(() => {
      setState(f());
    }, interval);
    return () => clearInterval(int);
  }, [state, ...deps]);
  return [state, () => setTimeout(() => setState(f()), 100)];
};

const Word = ({ word, controller, playerNames }) => {
  const [editing, setEditing] = useState(false);
  const [closed, refreshClosed] = usePoll(
    2000,
    () => word.deadline !== "never" && word.deadline < Date.now(),
    [word]
  );

  if (closed)
    return (
      <ClosedWord
        playerNames={playerNames}
        word={word}
        controller={controller}
        refreshClosed={refreshClosed}
      />
    );

  if (word.announced) {
    return (
      <AnnouncedWord
        playerNames={playerNames}
        word={word}
        controller={controller}
        refreshClosed={refreshClosed}
      />
    );
  }

  if (word.spelling === "" || editing) {
    return (
      <EditWord word={word} controller={controller} setEditing={setEditing} />
    );
  }
  return (
    <ReadyWord word={word} controller={controller} setEditing={setEditing} />
  );
};

const Submission = ({ spelling, playerName, definition }) => (
  <Card
    key={playerName}
    p={2}
    m={2}
    bg="yellow"
    sx={{ minWidth: 100, maxWidth: 200 }}
  >
    <Heading as="h3" sx={{ fontFamily: "serif" }}>
      {playerName}
    </Heading>
    <Text as="strong" sx={{ fontWeight: "bolder" }}>
      {spelling} -{" "}
    </Text>
    <Text as="span">{definition}</Text>
  </Card>
);

const Submissions = ({ word, playerNames }) => {
  const others = playerNames.filter(
    (name) =>
      word.submissions
        .map((s) => s.playerName)
        .filter((submitterName) => submitterName === name).length === 0
  );
  return (
    <Box>
      <Flex sx={{ flexWrap: "wrap", justifyContent: "space-between" }}>
        {word.submissions.map((submission) => (
          <Submission
            key={submission.playerName}
            spelling={word.spelling}
            {...submission}
          />
        ))}
      </Flex>
      {others.length > 0 && (
        <Box>
          <Heading as="h4">No submissions from</Heading>
          {others.map((name) => (
            <Text key={name}>{name}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

const ClosedWord = ({ playerNames, word, controller, refreshClosed }) => {
  return (
    <React.Fragment>
      <WordHeading word={word} />
      <Flex>
        <Button
          onClick={() =>
            controller.reopenSubmissions(word.id, () => refreshClosed())
          }
          variant="danger"
        >
          Reopen submissions
        </Button>
        <Button variant="info" onClick={() => controller.beginVoting(word.id)}>
          Begin Voting
        </Button>
      </Flex>

      <Submissions word={word} playerNames={playerNames} />
    </React.Fragment>
  );
};

const AnnouncedWord = ({ word, controller, playerNames, refreshClosed }) => {
  const [expiry, setExpiry] = useState("");
  const [pickExpiryAlert, setPickExpiryAlert] = useState(false);
  const countdown = useCountdown(word.deadline);
  const closeControls = (
    <React.Fragment>
      <Button
        onClick={() => {
          if (expiry === "") {
            setPickExpiryAlert(true);
            setTimeout(() => setPickExpiryAlert(false), 5000);
            return;
          }
          controller.setDeadline(word.id, Number(expiry), refreshClosed);
        }}
      >
        Close Submissions
      </Button>
      <Select
        name="deadline"
        value={expiry}
        pr={4}
        pl={4}
        m={2}
        onChange={(e) => setExpiry(e.target.value)}
      >
        <option value="" disabled={true} sx={{ color: "muted" }}>
          pick when...
        </option>
        <option value={0}>now</option>
        <option value={30}>in 30 seconds</option>
        <option value={60}>in 1 minute</option>
        <option value={300}>in 5 minutes</option>
        <option value={900}>in 15 minutes</option>
      </Select>
    </React.Fragment>
  );
  const closingControls = (
    <React.Fragment>
      <Alert p={2} m={2} mr="auto" variant="success">
        Submissions close in {countdown}
      </Alert>
      <Button
        variant="danger"
        m={2}
        onClick={() => controller.reopenSubmissions(word.id)}
      >
        Cancel
      </Button>
      <Button
        variant="info"
        m={2}
        onClick={() => controller.setDeadline(word.id, 0)}
      >
        Close now
      </Button>
    </React.Fragment>
  );
  return (
    <React.Fragment>
      <WordHeading word={word} />
      {pickExpiryAlert && (
        <Alert>
          <Text>Please select a time period for submissions to close</Text>
        </Alert>
      )}
      <Flex>{word.deadline === "never" ? closeControls : closingControls}</Flex>
      <Submissions word={word} playerNames={playerNames} />
    </React.Fragment>
  );
};

const WordHeading = ({ word }) => (
  <React.Fragment>
    <Heading p={2}>{word.spelling}</Heading>
    <Divider />
  </React.Fragment>
);

const ReadyWord = ({ word, controller, setEditing }) => {
  return (
    <React.Fragment>
      <WordHeading word={word} />
      <Flex sx={{ flexDirection: "row" }}>
        <Button onClick={() => setEditing(true)}>Edit</Button>
        <Button
          ml={1}
          variant="info"
          type="button"
          onClick={() => controller.announceWord(word.id)}
        >
          Announce
        </Button>
      </Flex>
    </React.Fragment>
  );
};

const EditWord = ({ word, controller, setEditing, n }) => {
  const [spelling, setSpelling] = useState(word.spelling || "");
  const [definition, setDefinition] = useState(word.correctDefinition || "");
  const hasChanged =
    spelling !== word.spelling || definition !== word.correctDefinition;
  const actionButton = (() => {
    if (word.spelling === "") {
      return (
        <Button variant="info" type="submit" disabled={spelling === ""}>
          Save
        </Button>
      );
    }
    if (!hasChanged) {
      return (
        <Button type="button" onClick={() => setEditing(false)}>
          Done
        </Button>
      );
    }
    return (
      <Button variant="info" type="submit" disabled={spelling === ""}>
        Update
      </Button>
    );
  })();
  return (
    <Box
      as="form"
      onSubmit={(e) => {
        console.log("submitted");
        e.preventDefault();

        controller.updateWord(word.id, spelling, definition, () =>
          setEditing(false)
        );
      }}
    >
      {word.spelling !== "" && <WordHeading word={word} />}

      <Label htmlFor="spelling">Spelling</Label>
      <Input
        name="spelling"
        placeholder="Spelling"
        value={spelling}
        onChange={(event) => setSpelling(event.target.value)}
      />
      <Label htmlFor="definition" mt={4}>
        Definition
      </Label>
      <Textarea
        name="definition"
        placeholder="Definition"
        value={definition}
        onChange={(event) => setDefinition(event.target.value)}
      />
      <Flex sx={{ flexDirection: "row" }} mt={2}>
        {actionButton}
        <Button
          type="button"
          variant="danger"
          onClick={() => controller.removeWord(word.id)}
        >
          Delete
        </Button>
      </Flex>
    </Box>
  );
};

const Voting = ({ controller, game }) => {
  return (
    <Box>
      <Button onClick={() => controller.stopVoting()}>End Voting</Button>
      <Box as="pre" sx={{ overflowX: "scroll" }}>
        {JSON.stringify(game, null, 2)}
      </Box>
    </Box>
  );
};

const ModRoom = ({ roomName, io, origin }) => {
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [controller, setController] = useState(null);

  if (error) {
    return <h1>Error: {error}</h1>;
  }
  useEffect(() => {
    if (!socket) {
      console.log("connecting...");
      connectToServer(
        io,
        roomName,
        setGame,
        setError,
        setController,
        setSocket
      );
    }
  }, []);
  if (!game) {
    return <h1>Connecting to server...</h1>;
  }

  const words = game.words;

  return (
    <React.Fragment>
      <CopyLink link={`${origin}/${roomName}`} mb={1} />
      <Chat
        playerNames={game.players}
        sendMessage={(text, callback) => {
          controller.sendChat(text, callback);
        }}
        messages={game.chat}
      />
      {game.voting ? (
        <Voting game={game} controller={controller} />
      ) : (
        <React.Fragment>
          <DragList
            draggables={words.map((word, i) => (
              <WordCard n={i + 1} id={word.id} key={word.id}>
                <Word
                  key={word.id}
                  word={word}
                  playerNames={game.players}
                  controller={controller}
                />
              </WordCard>
            ))}
            handleReorder={(ordering) =>
              controller.reorderWords(ordering.map((i) => words[i].id))
            }
          />
        </React.Fragment>
      )}

      <Button type="button" onClick={(e) => controller.addWord()}>
        Add Word
      </Button>
      <pre>{JSON.stringify(game, null, 2)}</pre>
    </React.Fragment>
  );
};

module.exports = {
  ModRoom,
};
