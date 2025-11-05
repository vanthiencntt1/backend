// models/User.js
// schema cho người dùng
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true }, // username can be null
  password: { type: String }, // password can be null if Zalo login
  phone: { type: String, unique: true, index: true, sparse: true },
  zalo_id: { type: String, unique: true, index: true, sparse: true },
  name: String,
  role: {
    type: String,
    enum: ["ADMIN", "USER", "DOCTOR"],
    default: "USER",
  },
  createdAt: { type: Date, default: Date.now },
  meta: Object,
});

// Hash password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema);
