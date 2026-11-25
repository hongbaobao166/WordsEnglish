# LearnEnglish

Ứng dụng học từ vựng Next.js, Refine, Django REST Framework và MySQL. Frontend xuất tĩnh qua Next.js App Router; Refine quản lý xác thực và kết nối dữ liệu đến API Django. Cấu hình này dành cho máy phát triển cục bộ, không phải triển khai công khai.

## Khởi động

Có hướng dẫn chi tiết cho máy mới tại [HUONG-DAN-DOCKER.md](HUONG-DAN-DOCKER.md).

Cần Docker Desktop và Docker Compose. Dùng file `.env` hiện có; với môi trường mới, sao chép `.env.example` thành `.env` và thay các giá trị mẫu bằng bí mật riêng. Không đổi mật khẩu trong `.env` với MySQL volume đã khởi tạo mà không cập nhật mật khẩu tương ứng trong MySQL.

Tại thư mục dự án:

```powershell
docker compose up -d --build
```

Hoặc chạy `.\start.ps1`. Mở http://localhost:8080. Backend tự chạy migration trước khi phục vụ API; MySQL dùng volume `learnenglish_mysql_data` hiện tại. Đăng ký tài khoản trên website; để quản trị nội dung, có thể tạo superuser bằng `docker compose exec backend python manage.py createsuperuser`.

Dừng bằng `.\stop.ps1` hoặc `docker compose stop`; cả hai giữ lại container và dữ liệu. Không dùng `docker compose down -v` nếu cần giữ dữ liệu.

## Kiểm thử

Frontend: `cd frontend; npm ci; npm test; npm run build`. Các fixture chỉ dành cho kiểm thử/phát triển, không bật trong Docker build.

Backend: Django tạo **và xóa** database chỉ định bởi `MYSQL_TEST_DATABASE`. Chỉ chạy sau khi được chủ sở hữu database cho phép và sau khi cấp quyền phù hợp cho riêng database kiểm thử. Ví dụ:

```powershell
docker compose run --rm -e MYSQL_TEST_DATABASE=learnenglish_test backend python manage.py test --noinput
```

Không đặt tên database kiểm thử là `learnenglish`; không chạy test nếu database kiểm thử đang chứa dữ liệu cần giữ.

## Lưu ý

- Đăng nhập học viên tại `/login`, tài khoản staff/superuser tại `/login-ad`. Chỉ superuser được quản lý vai trò hoặc thay đổi quyền và trạng thái tài khoản.
- Trong **Cài đặt quản trị**, superuser tạo vai trò và chọn các hành động thêm/sửa/xóa đối với từ vựng, chủ đề và cấp độ; sau đó gán vai trò cho tài khoản. Danh mục học tập vẫn cho mọi người dùng đã đăng nhập xem. Tài khoản staff cũ phải được gán quyền hoặc vai trò để tiếp tục chỉnh sửa nội dung.
- Vai trò hiện bao gồm ba tài nguyên trên; phân quyền người dùng/vai trò luôn chỉ dành cho superuser, không cho phép cấp quyền quản trị qua vai trò. Khi gán vai trò, tài khoản được bật quyền truy cập giao diện staff; xóa hết vai trò qua màn hình này sẽ tắt quyền đó.
- Một quiz cần tối thiểu 5 từ với ít nhất 4 nghĩa tiếng Việt khác nhau.
- Trong phần quản trị từ vựng, chọn **Thêm nhiều từ** để dán tối đa 100 dòng cùng cấp độ và danh mục. Mỗi dòng có dạng `từ | nghĩa tiếng Anh | nghĩa tiếng Việt`; cũng có thể dán ba cột từ Excel. API `POST /api/vocabulary/bulk/` yêu cầu quyền thêm từ và chỉ lưu khi toàn bộ hợp lệ.
- Để gán quyền, trước tiên tạo vai trò trong **Cài đặt quản trị**, sau đó vào **Người dùng** → **Gán vai trò**, chọn các vai trò và lưu.
- Dịch vụ chỉ bind vào localhost. Django `runserver` và khóa dự phòng chỉ phù hợp phát triển; không dùng cấu hình này làm cấu hình production.
- Nếu dữ liệu trống, cần tạo cấp độ qua API staff (`POST /api/levels/`); giao diện hiện chỉ sửa nhãn cấp độ đã có. Sau đó staff có thể thêm danh mục và từ vựng trên giao diện. Không có dữ liệu mẫu tự động.
