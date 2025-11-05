const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const User = require("../models/User"); // Import User model
const mongoose = require("mongoose"); // Add mongoose import
const multer = require("multer"); // Add multer import
const path = require("path"); // Add path import
const fs = require("fs"); // Add fs import
const Doctor = require("../models/Doctor");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt|zip|rar)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});

// Get chat rooms for a doctor
router.get("/chat-room/doctor/:doctorId", auth, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // 1. Find the doctor user by ID and role
    const doctor = await Doctor.findOne({ user_id: doctorId });

    if (!doctor) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    // Tìm tất cả phòng chat mà participant là bác sĩ (doctor._id) và có đúng 2 participants (1 bác sĩ + 1 bệnh nhân)
    const rooms = await ChatRoom.find({
      $and: [
        {
          participants: { $elemMatch: { user_id: doctor._id, role: "DOCTOR" } },
        },
        { participants: { $elemMatch: { role: "USER" } } },
      ],
    }).populate({
      path: "participants.user_id",
      select: "name role username avatar specialty experience",
    });

    // Trả về full object của từng phòng chat
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/chat-room/user/:patientId", auth, async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Kiểm tra user tồn tại
    const patient = await User.findOne({ _id: patientId, role: "USER" });
    if (!patient) {
      return res.status(404).json({ message: "Không tìm thấy bệnh nhân" });
    }

    // Tìm các phòng có bệnh nhân và bác sĩ
    const rooms = await ChatRoom.find({
      $and: [
        {
          participants: { $elemMatch: { user_id: patient._id, role: "USER" } },
        },
        { participants: { $elemMatch: { role: "DOCTOR" } } },
      ],
    })
      .populate({
        path: "participants.user_id",
        model: "User", // <--- Quan trọng: đảm bảo populate từ model User
        select: "name role username avatar specialty experience",
      })
      .lean(); // để trả object thuần

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// // Get chat rooms for a patient
// router.get("/chat-room/user/:patientId", auth, async (req, res) => {
//   try {
//     const patientId = req.params.patientId;

//     // Find the patient user by ID and role
//     const patient = await User.findOne({ _id: patientId, role: "USER" });

//     if (!patient) {
//       return res.status(404).json({ message: "Không tìm thấy bệnh nhân" });
//     }

//     // Tìm tất cả phòng chat mà participant là bệnh nhân (patient._id) và có đúng 2 participants (1 bác sĩ + 1 bệnh nhân)
//     const rooms = await ChatRoom.find({
//       $and: [
//         {
//           participants: { $elemMatch: { user_id: patient._id, role: "USER" } },
//         }, //,
//         // { participants: { $elemMatch: { role: "DOCTOR" } } },
//       ],
//     }).populate({
//       path: "participants.user_id",
//       model: "User", // <--- Quan trọng: đảm bảo populate từ model User
//       select: "name role username avatar specialty experience",
//     });

//     // Trả về full object của từng phòng chat
//     res.json(rooms);
//     console.log("rooms", rooms);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

router.post("/chat-room/create", auth, async (req, res) => {
  try {
    const { user_id, doctor_id } = req.body;

    // Validate input
    if (!user_id || !doctor_id) {
      return res
        .status(400)
        .json({ message: "user_id and doctor_id are required" });
    }

    // Check if a room between these two participants already exists
    let chatRoom = await ChatRoom.findOne({
      "participants.user_id": { $all: [user_id, doctor_id] },
      "participants.role": { $all: ["USER", "DOCTOR"] },
      participants: { $size: 2 }, // Ensure exactly 2 participants
    });

    if (chatRoom) {
      return res.json({ room_id: chatRoom.room_id });
    }

    // Create a new room_id
    const newRoomId = new mongoose.Types.ObjectId().toString();

    chatRoom = new ChatRoom({
      room_id: newRoomId,
      participants: [
        { user_id: user_id, role: "USER" },
        { user_id: doctor_id, role: "DOCTOR" },
      ],
      visible_to: [user_id, doctor_id],
    });

    await chatRoom.save();
    res.status(201).json({ room_id: chatRoom.room_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Upload file/image endpoint
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(req.file.originalname);

    res.status(200).json({
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      message_type: isImage ? "image" : "file",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// Get chat history by room ID
router.get("/messages/:roomId", auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;

    const messages = await Message.find({ room_id: roomId }).sort("timestamp");

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Create a message via REST (alternative to socket)
router.post("/messages", auth, async (req, res) => {
  try {
    const { room_id, message, message_type, file_url, file_name, file_size } =
      req.body;

    // Validate based on message type
    if (!room_id) {
      return res.status(400).json({ message: "room_id is required" });
    }

    const msgType = message_type || "text";
    if (msgType === "text" && !message) {
      return res
        .status(400)
        .json({ message: "message is required for text messages" });
    }
    if (
      (msgType === "image" || msgType === "file") &&
      (!file_url || !file_name)
    ) {
      return res.status(400).json({
        message: "file_url and file_name are required for file messages",
      });
    }

    const senderId = req.user.id;
    const room = await ChatRoom.findOne({ room_id });
    if (!room) return res.status(404).json({ message: "Chat room not found" });

    // Determine receiver
    const receiverParticipant = room.participants.find(
      (p) => p.user_id.toString() !== senderId.toString()
    );
    const receiverId = receiverParticipant
      ? receiverParticipant.user_id
      : undefined;
    const senderParticipant = room.participants.find(
      (p) => p.user_id.toString() === senderId.toString()
    );
    const senderRole = senderParticipant ? senderParticipant.role : "USER";

    const messageData = {
      room_id,
      sender_id: senderId,
      sender_role: senderRole,
      receiver_id: receiverId,
      message_type: msgType,
    };

    if (msgType === "text") {
      messageData.message = message;
    } else {
      messageData.file_url = file_url;
      messageData.file_name = file_name;
      messageData.file_size = file_size || 0;
    }

    const newMsg = new Message(messageData);
    await newMsg.save();

    // Update last_message for room
    const lastMessage = msgType === "text" ? message : `📎 ${file_name}`;
    await ChatRoom.findOneAndUpdate({ room_id }, { last_message: lastMessage });

    res.status(201).json(newMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Mark messages as read by room ID and sender ID
router.put("/messages/read/:roomId/:senderId", auth, async (req, res) => {
  try {
    const receiverId = req.user.id; // The user who is marking messages as read
    const roomId = req.params.roomId;
    const senderId = req.params.senderId;

    const result = await Message.updateMany(
      {
        room_id: roomId,
        sender_id: senderId,
        receiver_id: receiverId,
        read: false,
      },
      { $set: { read: true } }
    );

    res.json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
