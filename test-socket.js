const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("charger_status_updates", (data) => {
  console.log("charger_status_updates", data);
});
