import * as proxy from "http-proxy-middleware";

// this turns async exceptions into something Express can handle as errors
export const wrap = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

export const pause = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// This is needed to make Parcel Hot Module Replacement (live-updates) work on Glitch.
export const proxyParcelHMR = (app) => {
  const hmrProxy = proxy({
    target: "ws://localhost:12345/",
    ws: true,
    ignorePath: true,
    onOpen: (socket) => {
      // keepalive
      const handler = setInterval(() => {
        socket.write("\x89\x00", "binary");
      }, 30000);
      socket.on("close", () => {
        clearInterval(handler);
      });
    },
    logLevel: "error",
  });
  app.use("/__hmr:12345/", hmrProxy);
  return hmrProxy;
};
