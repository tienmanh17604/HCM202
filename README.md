# 🌟 HCM202 · Tư Tưởng Hồ Chí Minh Về ĐCSVN & Đánh Giá Chiến Dịch "Đốt Lò"

Dự án trực quan hóa học thuật cao cấp kết hợp **nghệ thuật 3D điện ảnh (Cinematic 3D Art)**, **Three.js WebGL**, hiệu ứng **Parallax không gian sâu** và **Bảng HUD Narrative Sidebar** thanh thoát.

---

## 🚀 Triển Khai Nhanh Lên Vercel (1-Click Deployment)

Dự án đã được cấu hình tối ưu sẵn tệp [`vercel.json`](./vercel.json) và [`package.json`](./package.json) với:
- **Clean URLs** (tự động điều hướng `/index.html` thành `/`).
- **Edge CDN Image Caching** (`max-age=31536000, immutable`) giúp tải các bức tranh 3D 8K với tốc độ tức thì, không giật lag.
- **Security Headers** chuẩn quốc tế (chống Clickjacking, XSS, MIME-sniffing).

### Các bước deploy trên Vercel:
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard).
2. Bấm nút **Add New...** ➜ Chọn **Project**.
3. Kết nối với GitHub và chọn repository **`tienmanh17604/HCM202`**.
4. Chọn nhánh bạn vừa đẩy code lên (nhánh `main`).
5. Để mặc định các thông số (Framework Preset: *Other*, Root Directory: `./`) và bấm **Deploy**.
6. Sau khoảng 10–15 giây, website của bạn sẽ online trên toàn cầu với tên miền miễn phí dạng `https://hcm202-*.vercel.app`!

---

## ⌨️ Phím Tắt Tương Tác
- <kbd>→</kbd> hoặc <kbd>Space</kbd>: Chuyển tới trạm kế tiếp.
- <kbd>←</kbd>: Quay lại trạm trước.
- <kbd>H</kbd>: Ẩn / Hiện bảng thông điệp (Narrative HUD) để chiêm ngưỡng 100% không gian 3D.
- <kbd>F</kbd>: Bật / Tắt chế độ toàn màn hình (Fullscreen).
- <kbd>Esc</kbd>: Đóng thẻ soi chi tiết vật thể (Inspect Tooltip).

---

## 🛠️ Công Nghệ Sử Dụng
- **Three.js (r128)**: Bụi sao lấp lánh (Cosmic particles) và vệt sáng năng lượng chuyển động.
- **AI Art 8K Generator**: 7 tác phẩm nghệ thuật 3D siêu thực đại diện cho 7 trạm lý luận.
- **Vanilla CSS Glassmorphism & Cyberpunk Design System**: Giao diện HUD bán trong suốt tinh tế, tương thích đa nền tảng.
