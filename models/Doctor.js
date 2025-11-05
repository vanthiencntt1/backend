const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có thể có 1 profile bác sĩ
    },
    // Thông tin cá nhân
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    date_of_birth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },
    address: {
      street: String,
      city: String,
      district: String,
      ward: String,
      postal_code: String,
    },

    // Thông tin nghề nghiệp
    medical_license_number: {
      type: String,
      required: true,
      unique: true, // Số chứng chỉ hành nghề duy nhất
    },
    specializations: [
      {
        type: String,
        required: true, // Ít nhất 1 chuyên khoa
      },
    ],
    department: {
      type: String,
      required: true, // Khoa làm việc
    },
    years_of_experience: {
      type: Number,
      min: 0,
    },
    education: [
      {
        degree: String, // Bằng cấp (Bác sĩ, Thạc sĩ, Tiến sĩ)
        institution: String, // Trường đại học
        year_graduated: Number,
      },
    ],
    certifications: [
      {
        name: String, // Tên chứng chỉ
        issuing_organization: String, // Tổ chức cấp
        issue_date: Date,
        expiry_date: Date,
      },
    ],

    // Thông tin công việc
    hospital_name: {
      type: String,
      required: true,
    },
    hospital_address: {
      type: String,
    },
    work_schedule: [
      {
        day_of_week: {
          type: String,
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
        },
        start_time: String, // Format: "08:00"
        end_time: String, // Format: "17:00"
        is_available: {
          type: Boolean,
          default: true,
        },
      },
    ],
    consultation_fee: {
      type: Number,
      min: 0,
    },

    // Thông tin bổ sung
    profile_picture: {
      type: String, // URL to profile image
    },
    bio: {
      type: String,
      maxlength: 500, // Mô tả ngắn về bác sĩ
    },
    languages: [
      {
        type: String, // Ngôn ngữ bác sĩ có thể giao tiếp
      },
    ],

    // Trạng thái và thống kê
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
      default: "PENDING_VERIFICATION",
    },
    verification_status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    total_consultations: {
      type: Number,
      default: 0,
    },

    // Metadata
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    verified_at: {
      type: Date,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    versionKey: false,
  }
);

// Indexes for better performance
DoctorSchema.index({ user_id: 1 });
DoctorSchema.index({ email: 1 });
DoctorSchema.index({ medical_license_number: 1 });
DoctorSchema.index({ specializations: 1 });
DoctorSchema.index({ department: 1 });
DoctorSchema.index({ status: 1 });
DoctorSchema.index({ "rating.average": -1 });

// Virtual để populate user info
DoctorSchema.virtual("user", {
  ref: "User",
  localField: "user_id",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
DoctorSchema.set("toJSON", { virtuals: true });
DoctorSchema.set("toObject", { virtuals: true });

// Pre-save middleware để update timestamp
DoctorSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Static methods
DoctorSchema.statics.findByUserId = function (userId) {
  return this.findOne({ user_id: userId }).populate("user");
};

DoctorSchema.statics.findBySpecialization = function (specialization) {
  return this.find({
    specializations: specialization,
    status: "ACTIVE",
    verification_status: "VERIFIED",
  }).populate("user");
};

DoctorSchema.statics.findAvailableDoctors = function () {
  return this.find({
    status: "ACTIVE",
    verification_status: "VERIFIED",
  }).populate("user");
};

// Instance methods
DoctorSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

DoctorSchema.methods.incrementConsultations = function () {
  this.total_consultations += 1;
  return this.save();
};

module.exports = mongoose.model("Doctor", DoctorSchema);
