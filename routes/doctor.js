const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// GET /api/doctors - Lấy danh sách tất cả bác sĩ (public)
router.get("/", async (req, res) => {
  try {
    const {
      specialization,
      department,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const query = {
      status: "ACTIVE",
      verification_status: "VERIFIED",
    };

    // Filter by specialization
    if (specialization) {
      query.specializations = { $in: [specialization] };
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Search by name
    if (search) {
      query.full_name = { $regex: search, $options: "i" };
    }

    const doctors = await Doctor.find(query)
      .populate("user", "username role")
      .select("-medical_license_number -certifications")
      .sort({ "rating.average": -1, total_consultations: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/doctors/:id - Lấy thông tin chi tiết 1 bác sĩ (public)
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("user", "username role")
      .select("-medical_license_number -certifications");

    if (!doctor) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    // Ensure avatar field is always present
    const docObj = doctor.toObject({ virtuals: true });
    if (!docObj.avatar) {
      docObj.avatar =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(docObj.name || "Bac Si") +
        "&background=random";
    }

    res.json(docObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/doctors/profile/me - Lấy profile bác sĩ hiện tại (require auth + doctor role)
router.get("/profile/me", auth, authorize(["DOCTOR"]), async (req, res) => {
  try {
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({ message: "Chưa có profile bác sĩ" });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/doctors/profile - Tạo profile bác sĩ (require auth + doctor role)
router.post("/profile", auth, authorize(["DOCTOR"]), async (req, res) => {
  try {
    // Kiểm tra xem user đã có profile bác sĩ chưa
    const existingDoctor = await Doctor.findOne({ user_id: req.user.id });
    if (existingDoctor) {
      return res.status(400).json({ message: "Profile bác sĩ đã tồn tại" });
    }

    const {
      full_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      medical_license_number,
      specializations,
      department,
      years_of_experience,
      education,
      hospital_name,
      hospital_address,
      work_schedule,
      consultation_fee,
      bio,
      languages,
    } = req.body;

    // Validate required fields
    if (
      !full_name ||
      !email ||
      !phone ||
      !medical_license_number ||
      !specializations ||
      !department ||
      !hospital_name
    ) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc",
      });
    }

    const doctor = new Doctor({
      user_id: req.user.id,
      full_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      medical_license_number,
      specializations,
      department,
      years_of_experience,
      education,
      hospital_name,
      hospital_address,
      work_schedule,
      consultation_fee,
      bio,
      languages,
    });

    await doctor.save();

    res.status(201).json({
      message: "Tạo profile bác sĩ thành công",
      doctor: await Doctor.findById(doctor._id).populate(
        "user",
        "username role"
      ),
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      if (error.keyPattern.medical_license_number) {
        return res
          .status(400)
          .json({ message: "Số chứng chỉ hành nghề đã được sử dụng" });
      }
    }
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/doctors/profile - Cập nhật profile bác sĩ (require auth + doctor role)
router.put("/profile", auth, authorize(["DOCTOR"]), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });

    if (!doctor) {
      return res.status(404).json({ message: "Chưa có profile bác sĩ" });
    }

    const allowedUpdates = [
      "full_name",
      "email",
      "phone",
      "date_of_birth",
      "gender",
      "address",
      "specializations",
      "department",
      "years_of_experience",
      "education",
      "hospital_name",
      "hospital_address",
      "work_schedule",
      "consultation_fee",
      "bio",
      "languages",
      "profile_picture",
    ];

    // Update only allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    res.json({
      message: "Cập nhật profile thành công",
      doctor: await Doctor.findById(doctor._id).populate(
        "user",
        "username role"
      ),
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
    }
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/doctors/specializations - Lấy danh sách chuyên khoa (public)
router.get("/meta/specializations", async (req, res) => {
  try {
    const specializations = await Doctor.distinct("specializations", {
      status: "ACTIVE",
      verification_status: "VERIFIED",
    });
    res.json(specializations.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/doctors/departments - Lấy danh sách khoa (public)
router.get("/meta/departments", async (req, res) => {
  try {
    const departments = await Doctor.distinct("department", {
      status: "ACTIVE",
      verification_status: "VERIFIED",
    });
    res.json(departments.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/doctors/:id/rate - Đánh giá bác sĩ (require auth)
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Đánh giá phải từ 1-5 sao" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    await doctor.updateRating(rating);

    res.json({
      message: "Đánh giá thành công",
      rating: {
        average: doctor.rating.average,
        count: doctor.rating.count,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ADMIN ROUTES

// GET /api/doctors/admin/pending - Lấy danh sách bác sĩ chờ xác thực (admin only)
router.get("/admin/pending", auth, authorize(["ADMIN"]), async (req, res) => {
  try {
    const doctors = await Doctor.find({
      verification_status: "PENDING",
    }).populate("user", "username role createdAt");

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/doctors/admin/:id/verify - Xác thực bác sĩ (admin only)
router.put(
  "/admin/:id/verify",
  auth,
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { status } = req.body; // "VERIFIED" hoặc "REJECTED"

      if (!["VERIFIED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      }

      doctor.verification_status = status;
      if (status === "VERIFIED") {
        doctor.status = "ACTIVE";
        doctor.verified_at = new Date();
      } else {
        doctor.status = "INACTIVE";
      }

      await doctor.save();

      res.json({
        message: `${
          status === "VERIFIED" ? "Xác thực" : "Từ chối"
        } bác sĩ thành công`,
        doctor,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
