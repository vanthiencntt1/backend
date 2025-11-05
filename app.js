const express = require("express");
const app = express();
const cors = require("cors"); // Import cors
const path = require("path");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("./models/User"); // Import User model

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:2999",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "https://h5.zdn.vn",
  "https://mini.zalo.me",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("Blocked HTTP origin", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
); // Use cors middleware with dynamic options

app.use(express.json({ limit: "50mb" })); // Increase limit for larger JSON payloads
app.use(express.urlencoded({ limit: "50mb", extended: true })); // Increase limit for larger URL-encoded payloads

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/chat", require("./routes/chat")); // Add chat routes
app.use("/api/doctors", require("./routes/doctor")); // Add doctor routes

/**
 * Endpoint nhận code (token) từ client,
 * gọi Zalo API để decode => lấy số điện thoại
 */
app.post("/auth/zalo/phone", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    // Gọi Zalo Graph API để decode token -> lấy phone, id
    // URL & params theo docs Zalo; nếu endpoint khác (phiên bản mới) hãy thay tương ứng.
    const resp = await axios.get("https://graph.zalo.me/v2.0/me/info", {
      params: {
        access_token: process.env.ZALO_OA_ACCESS_TOKEN,
        code: code,
        secret_key: process.env.ZALO_APP_SECRET,
      },
      timeout: 5000,
    });

    // Kiểm tra cấu trúc trả về
    // ví dụ resp.data = { data: { id: "...", number: "84912..." } }
    const data = resp.data?.data;
    if (!data)
      return res.status(500).json({ error: "Invalid response from Zalo" });

    const phone = data.number; // SĐT
    const zaloId = data.id || data.user_id;

    if (!phone)
      return res.status(400).json({ error: "Phone not returned by Zalo" });

    // Tìm user theo phone, nếu chưa có -> tạo
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        phone,
        zalo_id: zaloId,
        name: data.name || "",
        meta: data,
      });
      await user.save();
    } else {
      // update zalo_id nếu cần
      if (!user.zalo_id && zaloId) {
        user.zalo_id = zaloId;
        await user.save();
      }
    }

    // Tạo JWT (hoặc session)
    const token = jwt.sign(
      { uid: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      ok: true,
      token,
      user: { id: user._id, phone: user.phone },
    });
  } catch (err) {
    console.error("Decode phone error:", err.response?.data || err.message);
    // Xử lý lỗi Zalo trả về (code hết hạn, permission denied, ...)
    return res.status(500).json({ error: "Failed decode phone" });
  }
});

// Error handling middleware (must be after all routes and other middleware)
app.use((err, req, res, next) => {
  console.error("Backend Error:", err.stack); // Log the stack trace for debugging

  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ error: "Payload Too Large. The uploaded file is too large." });
  }

  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
