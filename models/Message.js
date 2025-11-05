const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    room_id: {
      type: String, // store ChatRoom.room_id string for consistency
      required: true,
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    sender_role: {
      type: String,
      enum: ["USER", "DOCTOR", "ADMIN"],
      required: true,
    },
    message_type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    message: {
      type: String,
      required: function () {
        return this.message_type === "text";
      },
    },
    file_url: {
      type: String,
      required: function () {
        return this.message_type === "image" || this.message_type === "file";
      },
    },
    file_name: {
      type: String,
      required: function () {
        return this.message_type === "image" || this.message_type === "file";
      },
    },
    file_size: {
      type: Number,
      required: function () {
        return this.message_type === "image" || this.message_type === "file";
      },
    },
    thumbnail_url: {
      type: String, // for image previews
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false }
);

MessageSchema.index({ room_id: 1, timestamp: -1 });

module.exports = mongoose.model("Message", MessageSchema);
