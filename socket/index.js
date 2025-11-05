const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom"); // Import ChatRoom model

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a chat room
    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
      console.log(`Client ${socket.id} joined room: ${roomId}`);
    });

    // Send a message with optional acknowledgement callback
    socket.on("send_message", async (payload, ack) => {
      const {
        roomId,
        senderId,
        senderRole,
        message,
        message_type,
        file_url,
        file_name,
        file_size,
      } = payload || {};

      const msgType = message_type || "text";

      // Validate based on message type
      if (!roomId || !senderId || !senderRole) {
        const errorObj = { success: false, error: "Missing required fields" };
        if (typeof ack === "function") ack(errorObj);
        return;
      }

      if (msgType === "text" && !message) {
        const errorObj = { success: false, error: "Message text is required" };
        if (typeof ack === "function") ack(errorObj);
        return;
      }

      if (
        (msgType === "image" || msgType === "file") &&
        (!file_url || !file_name)
      ) {
        const errorObj = {
          success: false,
          error: "File URL and name are required",
        };
        if (typeof ack === "function") ack(errorObj);
        return;
      }

      try {
        // Determine receiver (the other participant in room)
        const room = await ChatRoom.findOne({ room_id: roomId });
        let receiverId = undefined;
        if (room) {
          receiverId = room.participants
            .filter((p) => p.user_id.toString() !== senderId.toString())
            .map((p) => p.user_id)[0];
        }

        const messageData = {
          room_id: roomId,
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

        const newMessage = new Message(messageData);
        await newMessage.save();

        // Update last_message in ChatRoom
        const lastMessage = msgType === "text" ? message : `📎 ${file_name}`;
        await ChatRoom.findOneAndUpdate(
          { room_id: roomId },
          { last_message: lastMessage },
          { new: true }
        );

        const responseData = {
          _id: newMessage._id,
          room_id: newMessage.room_id,
          sender_id: newMessage.sender_id,
          sender_role: newMessage.sender_role,
          receiver_id: newMessage.receiver_id,
          message_type: newMessage.message_type,
          message: newMessage.message,
          file_url: newMessage.file_url,
          file_name: newMessage.file_name,
          file_size: newMessage.file_size,
          timestamp: newMessage.timestamp,
          read: newMessage.read,
        };

        io.to(roomId).emit("receive_message", responseData);
        if (typeof ack === "function") {
          ack({ success: true, message: responseData });
        }
        console.log(
          `${msgType} message sent to room ${roomId} from ${senderId} (${senderRole}) to ${receiverId}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        if (typeof ack === "function") {
          ack({ success: false, error: "Server error" });
        }
      }
    });

    // Disconnect event
    socket.on("disconnect", () => {
      // console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
