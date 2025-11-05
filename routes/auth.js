const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "Không tìm thấy tài khoản" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Mật khẩu không đúng" });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Use environment variable
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: { id: user.id, username: user.username, role: user.role },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  // Vì JWT stateless, client sẽ xóa token
  res.json({ message: "Đăng xuất thành công" });
});

module.exports = router;
