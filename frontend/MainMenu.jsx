import React, { useState } from "react";
import {
  Flex,
  Heading,
  Button,
  Label,
  Input,
  Text,
  Box,
  Alert,
  Field
} from "theme-ui";

const joinRoomAsPlayer = (name, roomName, setError) => {
  if (name.indexOf("/") !== -1) {
    return setError("Your name cannot contain '/'");
  }
  if (roomName.indexOf("/") !== -1) {
    return setError("Your room name cannot contain '/'");
  }
  if (name === "mod") {
    return setError("Your name cannot equal 'mod'");
  }
  window.location = `${window.origin}/${roomName}/${name}`;
  return false;
};

const joinRoomAsMod = (name, roomName, setError) => {
  if (roomName.indexOf("/") !== -1) {
    return setError("Your room name cannot contain '/'");
  }
  window.location = `${window.origin}/${roomName}/mod`;
};

const MainMenu = ({ room }) => {
  const [role, setRole] = useState(null);
  return (
    <Flex m={30} sx={{ flexDirection: "column" }}>
      <Heading>Fictionary Dictionary</Heading>
      <Box
        sx={{
          border: "thin",
          borderColor: "black",
          borderRadius: "sketchy0"
        }}
        p={2}
      >
        Fictionary Dictionary is a bluffing game where you try and fool your
        friends by writing fake dictionary definitions of obscure words.
      </Box>
      {role !== "mod" && role !== "player" && (
        <React.Fragment>
          <Button m={2} onClick={() => setRole("mod")} variant="info">
            Be a Moderator
          </Button>
          <Button m={2} onClick={() => setRole("player")} variant="info">
            Be a Player
          </Button>
        </React.Fragment>
      )}
      {role === "mod" && <ModeratorMenu setRole={setRole} room={room} />}
      {role === "player" && <PlayerMenu setRole={setRole} room={room} />}
    </Flex>
  );
};
const ModeratorMenu = ({ room, setRole }) => {
  const [roomName, setRoomName] = useState(room || "");
  const [error, setError] = useState(null);
  return (
    <React.Fragment>
      {error !== null ? <Alert>{error}</Alert> : null}
      <Box b={1}>
        <Label m={2} sx={{ flex: "1 3 auto" }} htmlFor="roomName" p={2}>
          <Text>Pick a name for the room you want to create or join</Text>
        </Label>
      </Box>
      <Input
        m={2}
        name="roomName"
        autoFocus
        placeholder="Name your room..."
        value={roomName}
        onChange={event => setRoomName(event.target.value.trim())}
      />

      <Button
        type="button"
        m={2}
        onClick={() => joinRoomAsMod(name, roomName, setError)}
        variant="info"
      >
        Join Room
      </Button>
    </React.Fragment>
  );
};
const PlayerMenu = ({ room, setRole }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(room);
  return (
    <Box
      as="form"
      onSubmit={e => {
        e.preventDefault();
        joinRoomAsPlayer(name, roomName, setError);
      }}
    >
      <Field
        label="Your name"
        m={2}
        name="name"
        value={name}
        autoFocus
        placeholder="Your name"
        onChange={event => setName(event.target.value)}
      />

      <Field
        label="Room to join"
        m={2}
        name="roomName"
        placeholder="Room name"
        value={roomName}
        onChange={event => setRoomName(event.target.value.trim())}
      />

      <Button type="submit">Join as Player</Button>
    </Box>
  );
};

const NameMenu = ({ roomName }) => <Menu roomName={roomName} />;
module.exports = {
  MainMenu,
  NameMenu
};
