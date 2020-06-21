import { useState, useEffect } from "react";

const prettyDuration = ms => {
  const minutes = Math.round(ms / 1000 / 60);
  if (minutes > 1) return `${minutes} minutes`;
  const seconds = Math.floor(ms / 1000 - minutes * 60);
  if (minutes === 1 && seconds === 1) return `1 minute and 1 second`;
  if (minutes === 1) return `1 minute and ${seconds} seconds`;
  return `${minutes} minutes and ${seconds} seconds`;
};

export const useCountdown = deadline => {
  const [remaining, setRemaining] = useState(
    deadline === "never" ? null : prettyDuration(deadline - Date.now())
  );
  const refreshRemaining = () => {
    if (deadline === "never") return setRemaining(null);
    if (deadline < Date.now()) return setRemaining(null);
    setRemaining(prettyDuration(deadline - Date.now()));
  };
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRemaining(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  });
  return remaining;
};
