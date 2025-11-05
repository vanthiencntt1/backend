# Doctor Management System

## Overview

Hệ thống quản lý thông tin bác sĩ được tích hợp vào ứng dụng chat y tế. Model Doctor liên kết với User model để lưu trữ thông tin chi tiết của bác sĩ.

## Database Models

### Doctor Model

Lưu trữ thông tin chi tiết của bác sĩ, liên kết với User model thông qua `user_id`.

**Thông tin cá nhân:**

- `full_name`: Họ tên đầy đủ
- `email`: Email liên hệ
- `phone`: Số điện thoại
- `date_of_birth`: Ngày sinh
- `gender`: Giới tính (MALE/FEMALE/OTHER)
- `address`: Địa chỉ chi tiết

**Thông tin nghề nghiệp:**

- `medical_license_number`: Số chứng chỉ hành nghề (unique)
- `specializations`: Danh sách chuyên khoa
- `department`: Khoa làm việc
- `years_of_experience`: Số năm kinh nghiệm
- `education`: Bằng cấp và học vấn
- `certifications`: Các chứng chỉ

**Thông tin công việc:**

- `hospital_name`: Tên bệnh viện
- `hospital_address`: Địa chỉ bệnh viện
- `work_schedule`: Lịch làm việc theo ngày
- `consultation_fee`: Phí tư vấn

**Trạng thái và thống kê:**

- `status`: ACTIVE/INACTIVE/SUSPENDED/PENDING_VERIFICATION
- `verification_status`: PENDING/VERIFIED/REJECTED
- `rating`: Điểm đánh giá trung bình và số lượt đánh giá
- `total_consultations`: Tổng số lượt tư vấn

## API Endpoints

### Public Endpoints

#### GET /api/doctors

Lấy danh sách bác sĩ đã được xác thực và đang hoạt động.

**Query Parameters:**

- `specialization`: Lọc theo chuyên khoa
- `department`: Lọc theo khoa
- `search`: Tìm kiếm theo tên
- `page`: Trang hiện tại (default: 1)
- `limit`: Số lượng kết quả/trang (default: 10, max: 50)

**Response:**

```json
{
  "doctors": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 42
}
```

#### GET /api/doctors/:id

Lấy thông tin chi tiết của một bác sĩ.

#### GET /api/doctors/meta/specializations

Lấy danh sách tất cả chuyên khoa có sẵn.

#### GET /api/doctors/meta/departments

Lấy danh sách tất cả khoa có sẵn.

### Doctor Endpoints (Require Authentication + DOCTOR role)

#### GET /api/doctors/profile/me

Lấy profile của bác sĩ hiện tại.

#### POST /api/doctors/profile

Tạo profile bác sĩ mới.

**Required Fields:**

- `full_name`
- `email`
- `phone`
- `medical_license_number`
- `specializations` (array)
- `department`
- `hospital_name`

#### PUT /api/doctors/profile

Cập nhật profile bác sĩ.

### User Endpoints

#### POST /api/doctors/:id/rate

Đánh giá bác sĩ (1-5 sao).

```json
{
  "rating": 5
}
```

### Admin Endpoints (Require ADMIN role)

#### GET /api/doctors/admin/pending

Lấy danh sách bác sĩ chờ xác thực.

#### PUT /api/doctors/admin/:id/verify

Xác thực hoặc từ chối bác sĩ.

```json
{
  "status": "VERIFIED" // hoặc "REJECTED"
}
```

## Usage Examples

### 1. Tạo tài khoản bác sĩ

```javascript
// 1. Đăng ký user với role DOCTOR
POST /api/auth/register
{
  "username": "doctor123",
  "password": "password",
  "role": "DOCTOR"
}

// 2. Đăng nhập để lấy token
POST /api/auth/login
{
  "username": "doctor123",
  "password": "password"
}

// 3. Tạo profile bác sĩ
POST /api/doctors/profile
Headers: Authorization: Bearer <token>
{
  "full_name": "Bác sĩ Nguyễn Văn A",
  "email": "doctor@hospital.com",
  "phone": "0901234567",
  "medical_license_number": "BS2024001",
  "specializations": ["Tim mạch", "Nội khoa"],
  "department": "Khoa Tim mạch",
  "hospital_name": "Bệnh viện ABC"
}
```

### 2. Tìm kiếm bác sĩ

```javascript
// Tìm bác sĩ chuyên khoa Tim mạch
GET /api/doctors?specialization=Tim mạch&page=1&limit=10

// Tìm bác sĩ theo tên
GET /api/doctors?search=Nguyễn&page=1
```

### 3. Đánh giá bác sĩ

```javascript
POST / api / doctors / [doctor_id] / rate;
Headers: Authorization: Bearer <
  token >
  {
    rating: 5,
  };
```

## Seeding Data

Để tạo dữ liệu mẫu:

```bash
cd backend-api
node seed-doctors.js
```

Script này sẽ tạo 3 bác sĩ mẫu với thông tin đầy đủ.

## Integration với Chat System

Model Doctor được tích hợp với hệ thống chat:

- Route `/api/users/chatable` giờ trả về thông tin chi tiết của bác sĩ
- Bao gồm chuyên khoa, khoa làm việc, bệnh viện, điểm đánh giá
- Chỉ hiển thị bác sĩ đã được xác thực và đang hoạt động

## Database Indexes

Các index được tạo để tối ưu performance:

- `user_id`: Tìm doctor theo user
- `email`: Unique constraint và search
- `medical_license_number`: Unique constraint
- `specializations`: Filter theo chuyên khoa
- `department`: Filter theo khoa
- `status`: Filter theo trạng thái
- `rating.average`: Sort theo điểm đánh giá

## Security Notes

- Số chứng chỉ hành nghề (`medical_license_number`) không được trả về trong public API
- Chứng chỉ (`certifications`) chỉ dành cho admin và chính bác sĩ đó
- Bác sĩ chỉ có thể cập nhật profile của chính mình
- Admin có thể xác thực/từ chối bác sĩ và xem tất cả thông tin
