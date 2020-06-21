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
  Grid
} from "theme-ui";
export const Chat = ({ playerNames, messages, sendMessage, ...props }) => {
  const [message, setMessage] = useState("");
  return (
    <Flex sx={{ flexDirection: "row" }}>
      <Box
        p={2}
        sx={{
          border: "2px solid black",
          borderRadius: `sketchy2`,
          overflowY: "auto",
          flexGrow: 1,
          flexWrap: "wrap",
          minWidth: 100
        }}
      >
        <Heading>Players</Heading>
        {playerNames.map(player => (
          <Box p={2} key={player}>
            {player}
          </Box>
        ))}
      </Box>
      <Box
        p={3}
        sx={{
          border: "2px solid black",
          borderRadius: `sketchy2`,
          flexGrow: "2",
          minWidth: 200
        }}
      >
        <Heading>Chat</Heading>
        <Box
          sx={{
            height: 200,
            overflowY: "auto"
          }}
        >
          {messages.map((message, i) => (
            <Text key={i}>
              <Text as="b">{message.playerName}: </Text>
              <Text as="span">{message.text}</Text>
            </Text>
          ))}
        </Box>
        <Flex
          sx={{ flexDirection: "row" }}
          as="form"
          onSubmit={e => {
            e.preventDefault();
            sendMessage(message, err => {
              if (err) console.error("TODO");
              setMessage("");
            });
            return false;
          }}
        >
          <Input
            placeholder="chat here"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <Button>Send</Button>
        </Flex>
      </Box>
    </Flex>
  );
};
