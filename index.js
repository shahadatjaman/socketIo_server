const express = require("express");
const app = express();

const http = require("http");

var server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
  },
});

let users = [];

// Add new user
let addUser = (userId, socketId) => {
  let user = users.some((u) => u.userId === userId);

  if (!user) {
    users.push({
      socketId: socketId,
      userId: userId,
    });
  }
};

// Get user
let getUser = (resiverId) => {
  return users.find((user) => user.userId === resiverId);
};

// Remove user
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

io.on("connection", (socket) => {
  console.log("someone joined");

  // Join User
  socket.on("join", async ({ userId }) => {
    addUser(userId, socket.id);

    if (users === users) {
      io.emit("getUsers", users);
    } else {
      setInterval(() => {
        io.emit("getUsers", users);
      }, 2000);
    }
  });

  // Send Creatot Message

  socket.on("sentCreatorMessage", (data) => {
    let user = getUser(data.sender);

    // creator to receiver for message
    let receiver = getUser(data.receiver);
    console.log(receiver);
    if (receiver) {
      socket.broadcast.to(receiver.socketId).emit("receiverMessage", data);
    }

    // creator to creator for message
    if (user) {
      io.to(user.socketId).emit("creatorMessage", data);
    }
  });

  // Create comments
  socket.on("createComment", (data) => {
    // Send to all public users
    socket.broadcast.emit("getComment", data);

    // Send to creator of comment
    const user = getUser(data.userId);

    if (user) {
      io.to(user.socketId).emit("creatorComment", data);
    }
  });

  // get Reply
  socket.on("getReply", (data) => {
    const creatorId = getUser(data.creatorId);

    if (creatorId) {
      io.to(creatorId.socketId).emit("reply", data);
    }

    socket.broadcast.emit("sendReply", data);
  });

  // send Notifications
  socket.on("sendNotification", (data) => {
    let user = getUser(data.receiver);

    if (user) {
      io.to(user.socketId).emit("getNotification", data);
      io.to(user.socketId).emit("notiCounter", { count: 1 });
    }
  });

  socket.on("disconnect", () => {
    console.log("Someone left");

    socket.emit("getUsers", users);
    removeUser(socket.id);
  });
});

app.get("*", (req, res) => {
  res.send("Welcome");
});

server.listen(process.env.PORT || 8080, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
