/** @jsx jsx */
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { MainMenu } from "./MainMenu";
import { ModRoom } from "./ModRoom";
import { PlayRoom } from "./PlayRoom";
import { ThemeProvider, Container, Button, merge, jsx } from "theme-ui";
import makeIO from "socket.io-client";
import sketchy from "theme-ui-sketchy-preset";
import DragList from "./DragList";

const getRoom = url => {
  const [base, roomName, name, ...rest] = url.split("/");
  if (rest.length > 0) {
    return {
      shape: "error",
      text: "Bad url, should contain only 2 slashes"
    };
  }
  if (!roomName) {
    return { shape: "menu" };
  }
  if (!name) {
    return { shape: "name", roomName };
  }
  if (name === "mod") {
    return { shape: "mod", roomName };
  }
  return { shape: "play", roomName, name };
};

const showError = ({ text }) => <h1>Error: {text}</h1>;

const App = ({ pathName, origin }) => {
  const loc = getRoom(pathName);
  if (loc.shape === "error") {
    return showError({ text: loc.text });
  }
  if (loc.shape === "menu") {
    return <MainMenu roomName="" />;
  }
  if (loc.shape === "name") {
    return <NameMenu roomName={loc.roomName} />;
  }
  if (loc.shape === "mod") {
    return (
      <ModRoom
        io={() => makeIO(origin)}
        roomName={loc.roomName}
        origin={origin}
      />
    );
  }
  if (loc.shape === "play") {
    return (
      <PlayRoom
        io={() => makeIO(origin)}
        roomName={loc.roomName}
        playerName={loc.name}
        origin={origin}
      />
    );
  }
};
const sketchyPrimaryButton = sketchy.buttons.primary;
const customTheme = {
  fonts: {
    em: { ...sketchy.fonts.body }
  },
  buttons: {
    disabled: {
      ...sketchyPrimaryButton,
      backgroundColor: "#eee",
      color: "#aaa",
      borderStyle: "dashed",
      "&:hover": null
    }
  },
  colors: { ...sketchy.colors, disabled: "#000", muted: "rgba(0,0,0,.1)", }
};
const theme = merge(sketchy, customTheme);
console.log(theme);
const main = () =>
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Container p={2}>
        <App
          pathName={document.location.pathname}
          origin={document.location.origin}
          sx={{ fontFamily: "sans-serif" }}
        />
      </Container>
    </ThemeProvider>,
    document.getElementById("main")
  );

const testDragList = () =>
  ReactDOM.render(
    <React.Fragment>
      <DragList
        draggables={[
          <div style={{ border: "20px black solid", padding: "100px 10px" }}>
            abc
          </div>,
          <div style={{ border: "20px red solid" }}>def</div>,

          <div style={{ border: "20px green solid" }}>
            ghi
            <br />
            jkl
          </div>,
          <div style={{ border: "20px blue solid", padding: "8px" }}>mno</div>
        ]}
      />
    </React.Fragment>,

    document.getElementById("main")
  );

const testSockets = () => {
  const io = makeIO(origin);
  io.once("connect", () => {
    io.on("update", console.log);
    io.emit("connectAsMod", { roomName: "foo" });

    ReactDOM.render(
      <ThemeProvider theme={theme}>
        <Container>
          <Button
            onClick={() => {
              console.log("doing it");
            }}
          >
            Richard
          </Button>
        </Container>
      </ThemeProvider>,
      document.getElementById("main")
    );
  });
};
//testSockets();
main();
