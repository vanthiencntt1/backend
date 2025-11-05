require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seedUsers = async () => {
  try {
    //await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connect(
      "mongodb+srv://vanthiencntt_db_user:LliFcp9KS21JjzZc@cluster0.d1f1nlm.mongodb.net/doctoronline?appName=Cluster0"
    );
    console.log("MongoDB connected for seeding.");

    // Xóa tất cả user cũ
    // await User.deleteMany({});
    //console.log("All existing users deleted.");

    const testUserUsername = "user2";

    const password = "123456"; // Mật khẩu mặc định cho tài khoản test

    // Tạo test user mới (password sẽ được hash tự động bởi pre-save hook)
    const user = new User({
      username: testUserUsername,
      password: password, // Không hash ở đây, để User model tự hash
      role: "USER",
    });
    await user.save();
    console.log(
      `Test user '${testUserUsername}' created with password: ${password}`
    );

    console.log("User seeding complete.");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedUsers();
