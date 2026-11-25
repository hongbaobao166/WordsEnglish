# Hướng dẫn chạy LearnEnglish bằng Docker Compose

Hướng dẫn này dành cho môi trường phát triển cục bộ trên Windows. Docker Compose sẽ build frontend và backend, sau đó khởi động chúng cùng MySQL.

## 1. Chuẩn bị

- Cài và mở Docker Desktop, chờ Docker Engine khởi động.
- Máy cần kết nối Internet trong lần build đầu để tải image và các gói phụ thuộc.
- Đảm bảo cổng `8080` và `3306` trên máy không bị ứng dụng khác sử dụng. Nếu đang dùng chính container MySQL của dự án hiện tại, không cần tạo container MySQL khác.
- Sao chép thư mục dự án, bao gồm `compose.yaml`, `backend/`, `frontend/`, `.env.example`, `start.ps1` và `stop.ps1`. Không cần sao chép `frontend/node_modules/`, `frontend/.next/`, `frontend/out/` hoặc `frontend/dist/`.

## 2. Cấu hình trên máy mới

Mở PowerShell tại **thư mục gốc dự án** — thư mục chứa `compose.yaml`, không phải thư mục `backend` hay `frontend`.

Nếu chưa có `.env`, tạo từ file mẫu:

```powershell
Copy-Item .env.example .env
notepad .env
```

Trong `.env`, thay các giá trị mẫu bằng mật khẩu MySQL và khóa Django riêng. Không chia sẻ file `.env` hoặc đưa nó lên Git.

**Nếu MySQL volume đã có dữ liệu:** dùng đúng thông tin kết nối hiện có. Việc sửa mật khẩu trong `.env` không tự đổi mật khẩu đã lưu trong MySQL và có thể làm backend không kết nối được.

## 3. Build và khởi động

Từ thư mục chứa `compose.yaml`, chạy:

```powershell
docker compose up -d --build
```

Hoặc chạy `.\start.ps1`. Lần đầu có thể mất vài phút. Backend tự chạy migration khi khởi động.

Kiểm tra trạng thái:

```powershell
docker compose ps
```

Mở:

- Học viên: http://localhost:8080/login/
- Quản trị: http://localhost:8080/login-ad/

Trên database mới, đăng ký tài khoản học viên trên website. Nếu cần tài khoản quản trị đầu tiên, tạo bằng:

```powershell
docker compose exec backend python manage.py createsuperuser
```

Nhập tên đăng nhập, email và mật khẩu khi được yêu cầu. Không lưu mật khẩu vào mã nguồn.

## 4. Dừng và khởi động lại

```powershell
docker compose stop
```

Hoặc dùng `.\stop.ps1`. Lệnh này giữ container và dữ liệu. Để chạy lại và build nếu mã nguồn thay đổi:

```powershell
docker compose up -d --build
```

Không dùng `docker compose down -v`, không xóa MySQL volume nếu cần giữ dữ liệu.

## 5. Dữ liệu khi chuyển máy

MySQL lưu dữ liệu trong Docker volume, không nằm trong các thư mục mã nguồn được sao chép. Trên máy mới, Compose sẽ tạo volume/database mới nếu chưa có: tài khoản, vai trò, từ vựng và tiến độ từ máy cũ **không tự chuyển theo**.

Nếu cần mang dữ liệu cũ sang, hãy sao lưu và khôi phục MySQL riêng trước khi sử dụng; không ghi đè hoặc reset database đang có dữ liệu mà chưa kiểm tra và xác nhận.

## 6. Xem lỗi

```powershell
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend
docker compose logs --tail 100 mysql
```

- Nếu báo thiếu biến môi trường, kiểm tra `.env` ở cùng thư mục với `compose.yaml`.
- Nếu báo cổng đã được sử dụng, kiểm tra ứng dụng đang chiếm cổng trước khi thay đổi cấu hình. Không xóa container hoặc volume MySQL có dữ liệu để xử lý xung đột.
- Nếu backend không kết nối được MySQL cũ, kiểm tra mật khẩu `.env` khớp với tài khoản MySQL đã khởi tạo.
- Nếu trình duyệt còn giao diện cũ, tải lại bằng `Ctrl + F5`.

Cấu hình này chỉ bind cổng vào `localhost` và dùng Django `runserver`; không dùng nguyên trạng để triển khai công khai.
