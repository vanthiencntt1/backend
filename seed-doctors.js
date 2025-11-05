require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Doctor = require("./models/Doctor");

const sampleDoctors = [
  {
    username: "doctor1",
    password: "123456",
    doctorInfo: {
      full_name: "Bác sĩ Nguyễn Văn A",
      email: "doctor1@hospital.com",
      phone: "0901234567",
      date_of_birth: new Date("1980-05-15"),
      gender: "MALE",
      address: {
        street: "123 Đường ABC",
        city: "Hồ Chí Minh",
        district: "Quận 1",
        ward: "Phường Bến Nghé",
        postal_code: "70000",
      },
      medical_license_number: "BS2024001",
      specializations: ["Tim mạch", "Nội khoa"],
      department: "Khoa Tim mạch",
      years_of_experience: 10,
      education: [
        {
          degree: "Bác sĩ Y khoa",
          institution: "Đại học Y Dược TP.HCM",
          year_graduated: 2010,
        },
        {
          degree: "Thạc sĩ Tim mạch",
          institution: "Đại học Y Dược TP.HCM",
          year_graduated: 2015,
        },
      ],
      hospital_name: "Bệnh viện Tim Hà Nội",
      hospital_address: "123 Đường XYZ, Hà Nội",
      work_schedule: [
        {
          day_of_week: "MONDAY",
          start_time: "08:00",
          end_time: "17:00",
          is_available: true,
        },
        {
          day_of_week: "TUESDAY",
          start_time: "08:00",
          end_time: "17:00",
          is_available: true,
        },
        {
          day_of_week: "WEDNESDAY",
          start_time: "08:00",
          end_time: "17:00",
          is_available: true,
        },
      ],
      consultation_fee: 500000,
      bio: "Bác sĩ chuyên khoa Tim mạch với 10 năm kinh nghiệm, từng công tác tại nhiều bệnh viện lớn.",
      languages: ["Tiếng Việt", "English"],
      status: "ACTIVE",
      verification_status: "VERIFIED",
    },
  },
  {
    username: "doctor2",
    password: "123456",
    doctorInfo: {
      full_name: "Bác sĩ Trần Thị B",
      email: "doctor2@hospital.com",
      phone: "0907654321",
      date_of_birth: new Date("1985-08-20"),
      gender: "FEMALE",
      address: {
        street: "456 Đường DEF",
        city: "Hà Nội",
        district: "Quận Ba Đình",
        ward: "Phường Điện Biên",
        postal_code: "10000",
      },
      medical_license_number: "BS2024002",
      specializations: ["Nhi khoa", "Sơ sinh"],
      department: "Khoa Nhi",
      years_of_experience: 8,
      education: [
        {
          degree: "Bác sĩ Y khoa",
          institution: "Đại học Y Hà Nội",
          year_graduated: 2012,
        },
      ],
      hospital_name: "Bệnh viện Nhi Trung ương",
      hospital_address: "18-32 Đường La Thành, Hà Nội",
      work_schedule: [
        {
          day_of_week: "MONDAY",
          start_time: "07:30",
          end_time: "16:30",
          is_available: true,
        },
        {
          day_of_week: "THURSDAY",
          start_time: "07:30",
          end_time: "16:30",
          is_available: true,
        },
        {
          day_of_week: "FRIDAY",
          start_time: "07:30",
          end_time: "16:30",
          is_available: true,
        },
      ],
      consultation_fee: 400000,
      bio: "Bác sĩ chuyên khoa Nhi với đam mê chăm sóc sức khỏe trẻ em.",
      languages: ["Tiếng Việt"],
      status: "ACTIVE",
      verification_status: "VERIFIED",
    },
  },
  {
    username: "doctor3",
    password: "123456",
    doctorInfo: {
      full_name: "Bác sĩ Lê Văn C",
      email: "doctor3@hospital.com",
      phone: "0912345678",
      date_of_birth: new Date("1978-12-10"),
      gender: "MALE",
      address: {
        street: "789 Đường GHI",
        city: "Đà Nẵng",
        district: "Quận Hải Châu",
        ward: "Phường Hải Châu 1",
        postal_code: "50000",
      },
      medical_license_number: "BS2024003",
      specializations: ["Thần kinh", "Đột quỵ"],
      department: "Khoa Thần kinh",
      years_of_experience: 15,
      education: [
        {
          degree: "Bác sĩ Y khoa",
          institution: "Đại học Y Dược Huế",
          year_graduated: 2005,
        },
        {
          degree: "Tiến sĩ Thần kinh học",
          institution: "Đại học Y Dược TP.HCM",
          year_graduated: 2018,
        },
      ],
      hospital_name: "Bệnh viện Đà Nẵng",
      hospital_address: "124 Hải Phòng, Đà Nẵng",
      work_schedule: [
        {
          day_of_week: "TUESDAY",
          start_time: "08:00",
          end_time: "17:00",
          is_available: true,
        },
        {
          day_of_week: "WEDNESDAY",
          start_time: "08:00",
          end_time: "17:00",
          is_available: true,
        },
        {
          day_of_week: "SATURDAY",
          start_time: "08:00",
          end_time: "12:00",
          is_available: true,
        },
      ],
      consultation_fee: 600000,
      bio: "Tiến sĩ chuyên khoa Thần kinh với 15 năm kinh nghiệm điều trị đột quỵ và các bệnh lý thần kinh.",
      languages: ["Tiếng Việt", "English", "Français"],
      status: "ACTIVE",
      verification_status: "VERIFIED",
    },
  },
];

async function seedDoctors() {
  try {
    //await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connect(
      "mongodb+srv://vanthiencntt_db_user:LliFcp9KS21JjzZc@cluster0.d1f1nlm.mongodb.net/doctoronline?appName=Cluster0"
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await Doctor.deleteMany({});
    await User.deleteMany({ role: "DOCTOR" });
    console.log("Cleared existing doctor data");

    // Create users and doctors
    for (const doctorData of sampleDoctors) {
      // Create user
      const user = new User({
        username: doctorData.username,
        password: doctorData.password,
        role: "DOCTOR",
      });

      await user.save();
      console.log(`Created user: ${user.username}`);

      // Create doctor profile
      const doctor = new Doctor({
        user_id: user._id,
        ...doctorData.doctorInfo,
      });

      await doctor.save();
      console.log(`Created doctor profile: ${doctor.full_name}`);
    }

    console.log("Sample doctors created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding doctors:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDoctors();
