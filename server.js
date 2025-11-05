require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const app = require("./app");
const http = require("http"); // Import http
const { Server } = require("socket.io"); // Import Server from socket.io
const setupSocketHandlers = require("./socket"); // Import the socket handlers

const uri =
  "mongodb+srv://vanthiencntt_db_user:LliFcp9KS21JjzZc@cluster0.d1f1nlm.mongodb.net/doctoronline?appName=Cluster0"; // MongoDB Atlas URI with 'doctoronline' database

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:2999",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected");
    const server = http.createServer(app); // Create http server

    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          console.warn("Blocked socket origin", origin);
          callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    setupSocketHandlers(io); // Pass the io instance to the socket handlers

    server.listen(process.env.PORT, () => {
      console.log("Server running on port " + process.env.PORT);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
