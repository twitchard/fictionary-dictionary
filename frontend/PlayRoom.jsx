/** @jsx jsx */
import React, { useState, useEffect, useRef } from "react";
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
  Message,
  Field,
  Grid,
  jsx
} from "theme-ui";

import { submitDefinitionAction, sendChatAction } from "../lib/game";

import CopyLink from "./CopyLink";
import { useCountdown } from "./Countdown";
import { Chat } from "./Chat";

const connectToServer = (
  io,
  roomName,
  playerName,
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
    console.log("reconnected");
  });
  socket.on("reconnect_attempt", () => {
    console.log("reconnecting...");
  });
  socket.once("connect", () => {
    window.addEventListener("beforeunload", () => {
      socket.close();
    });
    socket.emit("connectAsPlayer", { roomName, playerName });
    socket.on("update", game => {
      setGame(game);
    });
    socket.once("update", () => {
      const emit = (action, callback) => {
        console.log("emitting...", action);
        const action_id = `${Math.floor(Math.random() * 10000)}`;
        socket.emit("action", { ...action, action_id });
        if (callback) socket.once(`ack${action_id}`, callback);
      };
      return setController({
        sendChat: (text, callback) => {
          emit(sendChatAction(playerName, text), callback);
        },
        submitDefinition: (id, definition, callback) => {
          emit(submitDefinitionAction(id, playerName, definition), callback);
        }
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
        borderRadius: `sketchy${id % 5}`
      }}
      {...rest}
    ></Card>
  );
};

const EditDefinition = ({ word, controller, playerName }) => {
  const [definition, setDefinition] = useState(
    (word.mySubmission && word.mySubmission.definition) || ""
  );
  const [remaining, setRemaining] = useState(
    word.deadline === "never"
      ? null
      : prettyDuration(word.deadline - Date.now())
  );
  const refreshRemaining = () => {
    if (word.deadline === "never") return setRemaining(null);
    if (word.deadline < Date.now()) return setRemaining(null);
    setRemaining(prettyDuration(word.deadline - Date.now()));
  };
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRemaining(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  });
  const canSave =
    definition !== "" &&
    (!word.mySubmission || word.mySubmission.definition !== definition);
  return (
    <Box
      as="form"
      onSubmit={e => {
        e.preventDefault();
        if (!canSave) return;

        controller.submitDefinition(word.id, definition);
      }}
    >
      <Flex>
        <Heading>{word.spelling}</Heading>
      </Flex>

      <Countdown deadline={word.deadline} />

      <Label htmlFor="definition" mt={4}>
        Definition
      </Label>
      <Textarea
        name="definition"
        placeholder="Definition"
        value={definition}
        onChange={event => setDefinition(event.target.value)}
      />
      <Flex sx={{ flexDirection: "row" }} mt={2}>
        <Button type="submit" variant={canSave ? "info" : "disabled"}>
          {word.mySubmission ? "Update" : "Submit"}
        </Button>
      </Flex>
    </Box>
  );
};

const PlayRoom = ({ roomName, playerName, io, origin }) => {
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
        playerName,
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

  console.log(game);
  console.log(game.chat);
  return (
    <React.Fragment>
      <CopyLink link={`${origin}/${roomName}`} mb={2} />
      <Chat
        playerNames={game.players}
        sendMessage={(text, callback) => {
          controller.sendChat(text, callback);
        }}
        messages={game.chat}
      />

      <Heading mt={4}>Words</Heading>
      {words.map((word, i) => (
        <WordCard n={i + 1} id={word.id} key={word.id}>
          {word.announced && (
            <EditDefinition
              key={word.id}
              word={word}
              playerName={playerName}
              controller={controller}
            />
          )}
        </WordCard>
      ))}
      <pre>{JSON.stringify(game, null, 2)}</pre>
    </React.Fragment>
  );
};

module.exports = {
  PlayRoom
};
