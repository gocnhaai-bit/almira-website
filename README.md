# Almira.Studiooo — Website

Website bán hàng thời trang nữ order cao cấp cho **Almirastudio.vn** (song ngữ Việt/Anh).

## Triển khai

Đây là website tĩnh trong **một file duy nhất** (`index.html`, đã nhúng toàn bộ CSS/JS/hình ảnh).

- **GitHub Pages:** vào repo Settings → Pages → Deploy from a branch → chọn branch `main`, thư mục `/ (root)` → trang sẽ chạy tại `https://gocnhaai-bit.github.io/almira-website/`
- **Hosting riêng / domain almirastudio.vn:** upload file `index.html` lên thư mục public của hosting và trỏ domain về.

## Tính năng

- Trang chủ, cửa hàng (lọc/tìm kiếm/sắp xếp), chi tiết sản phẩm (chọn size/màu)
- Giỏ hàng, form đặt hàng sinh mã đơn (lưu local, shop xác nhận thủ công)
- Song ngữ Việt/Anh, giao diện glassmorphism minimal luxury
- Kênh liên hệ: Instagram, Threads, Facebook

## Hiệu ứng chuyển động (motion layer)

Toàn bộ vẫn nằm trong một file `index.html`. Motion được thiết kế theo hướng **quiet luxury**: chậm, dứt khoát, không nảy/bounce, chỉ dùng `transform` – `opacity` – `clip-path` để giữ 60fps.

- **Mở màn**: tấm màn the nhẹ (blush/glass) ~0,6s rồi kéo lên, hero đã chạy sẵn phía sau. Chỉ hiện ở lần truy cập đầu trong phiên (`sessionStorage: almira-intro`), tự bỏ qua với người dùng giảm chuyển động.
- **Hero**: 3 dòng tiêu đề trượt lên từ mặt nạ, các khối nội dung hiện theo nhịp; panel kính nghiêng nhẹ theo con trỏ + vệt sáng; ảnh đá marble trôi chậm (Ken Burns); nút CTA hút nhẹ theo chuột.
- **Cuộn trang**: thanh tiến trình mảnh trên đầu, header nổi lên khi cuộn, tiêu đề section tách từng từ, ảnh about wipe + parallax, đường nối 4 bước vẽ dần, danh mục/sản phẩm/perks hiện so le.
- **Thương mại**: card sản phẩm nghiêng 3D nhẹ + spotlight theo con trỏ, ảnh zoom chậm; thêm vào giỏ có badge pop (fly-to-cart chỉ trên desktop), drawer/modal có nhịp vào riêng, toast trượt mềm.
- **Vi tương tác**: con trỏ kính có nhãn "XEM/VIEW" khi hover ảnh sản phẩm, nút có vệt sáng (sheen), input focus rõ ràng, nút back-to-top có vòng tiến trình cuộn.
- **A11y**: tôn trọng `prefers-reduced-motion: reduce` (tắt toàn bộ chuyển động, nội dung hiện ngay), `:focus-visible` rõ nét, focus trap trong drawer/modal, mọi nội dung vẫn hiển thị khi JS lỗi hoặc bị tắt.

Tinh chỉnh nhanh: các token nằm ở `:root` trong khối `PREMIUM MOTION LAYER` (cuối `<style>`) — `--ease-lux`, `--ease-soft`, `--ease-inout`, `--dur-1…4`, `--rise`, `--stagger`. Toàn bộ logic điều phối nằm ở khối `PREMIUM MOTION LAYER` cuối `<script>`.
