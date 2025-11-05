const mongoose = require("mongoose");

const ChatRoomSchema = new mongoose.Schema({
  room_id: {
    type: String,
    required: true,
    unique: true,
  },
  participants: [
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["USER", "DOCTOR", "ADMIN"],
        required: true,
      },
    },
  ],
  visible_to: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  last_message: {
    type: String,
  },
});

module.exports = mongoose.model("ChatRoom", ChatRoomSchema);
