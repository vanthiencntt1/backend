const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get(
  "/",
  auth,
  authorize(["ADMIN"]), // Only OWNER can view all users
  async (req, res) => {
    try {
      const users = await User.find().select("-password"); // Don't return passwords
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/chatable", auth, async (req, res) => {
  try {
    const currentUser = req.user.id;
    const Doctor = require("../models/Doctor");

    // Get active verified doctors with their user info
    const doctors = await Doctor.find({
      user_id: { $ne: currentUser },
      status: "ACTIVE",
      verification_status: "VERIFIED",
    })
      .populate("user", "username role")
      .select(
        "full_name specializations department hospital_name profile_picture rating"
      )
      .lean();

    const safe = doctors.map((d) => ({
      _id: d.user_id,
      name: d.full_name || d.user?.username,
      username: d.user?.username,
      role: d.user?.role,
      specializations: d.specializations,
      department: d.department,
      hospital_name: d.hospital_name,
      profile_picture: d.profile_picture,
      rating: d.rating?.average || 0,
      doctor_id: d._id,
    }));

    res.json(safe);
  } catch (err) {
    console.error("Chatable doctors error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get(
  "/:id",
  auth,
  authorize(["ADMIN", "USER"]), // All roles can view their own profile
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password"); // Don't return password
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/",
  auth,
  authorize(["ADMIN", "USER"]), // Only OWNER can create users
  async (req, res) => {
    try {
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.put(
  "/:id",
  auth,
  authorize(["ADMIN"]), // Only OWNER can update users
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).select("-password"); // Don't return password
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.delete(
  "/:id",
  auth,
  authorize(["ADMIN"]), // Only OWNER can delete users
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id).select(
        "-password"
      ); // Don't return password
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
