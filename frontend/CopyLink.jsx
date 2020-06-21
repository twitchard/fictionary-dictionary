import React, { useState } from "react";
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
  Select
} from "theme-ui";
export default ({ link, ...props }) => {
  const [recentlyCopied, setRecentlyCopied] = useState();
  const [recentlyCouldntCopy, setRecentlyCouldntCopy] = useState();
  const handleCopy = () => {
    if (!navigator.clipboard) {
      setRecentlyCouldntCopy(true);
      setTimeout(() => setRecentlyCouldntCopy(false), 2000);
      return;
    }
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setRecentlyCopied(true);
        setTimeout(() => setRecentlyCopied(false), 2000);
      })
      .catch(() => {
        setRecentlyCouldntCopy(true);
        setTimeout(() => setRecentlyCouldntCopy(false), 2000);
      });
  };
  return (
    <Box {...props}>
      <Label>Invite your friends by sending them this link</Label>
      {recentlyCopied && (
        <Alert variant="success" m={2}>
          Copied to clipboard
        </Alert>
      )}
      <Flex m={0}>
        <Input m={0} pl={4} value={link} readOnly onClick={handleCopy} />
        <Button variant="info" onClick={handleCopy}>
          Copy
        </Button>
      </Flex>

      {recentlyCouldntCopy && <Alert m={2}>Could not copy to clipboard</Alert>}
    </Box>
  );
};
