# Almira.Studiooo — Website

Website bán hàng thời trang nữ order cao cấp cho **Almirastudio.vn** (song ngữ Việt/Anh).

## Triển khai

Website tĩnh: trang chính `index.html` và các module trong `assets/` (routing trang riêng, checkout, cấu hình thanh toán).

- **GitHub Pages:** vào repo Settings → Pages → Deploy from a branch → chọn branch `main`, thư mục `/ (root)` → trang sẽ chạy tại `https://gocnhaai-bit.github.io/almira-website/`
- **Hosting riêng / domain almirastudio.vn:** upload `index.html` **và toàn bộ thư mục `assets/`**, cùng các tài nguyên hiện có. Không chỉ upload mỗi HTML.

## Tính năng

- Trang chủ, cửa hàng (lọc/tìm kiếm/sắp xếp), chi tiết sản phẩm (chọn size/màu)
- Trang riêng qua hash routes tương thích GitHub Pages: `#/shop`, `#/brands`, `#/cats`, `#/how`, `#/about`, `#/contact`, `#/policy`, `#/product/<id>`, `#/checkout`. Back/forward và tải lại URL hoạt động, không cần rewrite server.
- Giỏ hàng lưu trong sessionStorage để không mất khi tải lại trong cùng tab; thông tin người nhận chỉ giữ trong bộ nhớ.
- Checkout hai bước: thông tin giao hàng → chọn MB Bank hoặc PayPal, có kiểm tra trường bắt buộc và tóm tắt cọc 50%.
- **Chưa có backend gửi đơn/xác minh thanh toán.** Không sinh trạng thái đặt hàng/thanh toán thành công giả, không tự xóa giỏ. Khách liên hệ shop để chốt đơn.
- Nhập thông tin đích nhận tiền công khai trong `assets/payment-config.js`: `bank.accountNumber`, `bank.beneficiary`, `paypal.url` (HTTPS trên paypal.com hoặc paypal.me). Không nhập API secret. Khi trống, CTA tương ứng bị khóa và thông báo rõ chưa cấu hình. PayPal là liên kết ngoài, chưa tự truyền số tiền hay đối soát webhook.
- Song ngữ Việt/Anh, giao diện glassmorphism minimal luxury
- Kênh liên hệ: Instagram, Threads, Facebook

## Hiệu ứng chuyển động (motion layer)

Motion chính nằm trong `index.html`, chuyển trang/checkout bổ sung tại `assets/checkout.css`. Motion được thiết kế theo hướng **quiet luxury**: chậm, dứt khoát, không nảy/bounce, chỉ dùng `transform` – `opacity` – `clip-path` để giữ 60fps.

- **Mở màn**: tấm màn the nhẹ (blush/glass) ~0,6s rồi kéo lên, hero đã chạy sẵn phía sau. Chỉ hiện ở lần truy cập đầu trong phiên (`sessionStorage: almira-intro`), tự bỏ qua với người dùng giảm chuyển động.
- **Hero**: 3 dòng tiêu đề trượt lên từ mặt nạ, các khối nội dung hiện theo nhịp; panel kính nghiêng nhẹ theo con trỏ + vệt sáng; ảnh đá marble trôi chậm (Ken Burns); nút CTA hút nhẹ theo chuột.
- **Cuộn trang**: thanh tiến trình mảnh trên đầu, header nổi lên khi cuộn, tiêu đề section tách từng từ, ảnh about wipe + parallax, đường nối 4 bước vẽ dần, danh mục/sản phẩm/perks hiện so le.
- **Thương mại**: card sản phẩm nghiêng 3D nhẹ + spotlight theo con trỏ, ảnh zoom chậm; thêm vào giỏ có badge pop (fly-to-cart chỉ trên desktop), drawer/modal có nhịp vào riêng, toast trượt mềm.
- **Vi tương tác**: con trỏ kính có nhãn "XEM/VIEW" khi hover ảnh sản phẩm, nút có vệt sáng (sheen), input focus rõ ràng, nút back-to-top có vòng tiến trình cuộn.
- **A11y**: tôn trọng `prefers-reduced-motion: reduce` (tắt toàn bộ chuyển động, nội dung hiện ngay), `:focus-visible` rõ nét, focus trap trong drawer/modal, mọi nội dung vẫn hiển thị khi JS lỗi hoặc bị tắt.

Tinh chỉnh nhanh: các token nằm ở `:root` trong khối `PREMIUM MOTION LAYER` (cuối `<style>`) — `--ease-lux`, `--ease-soft`, `--ease-inout`, `--dur-1…4`, `--rise`, `--stagger`. Toàn bộ logic điều phối nằm ở khối `PREMIUM MOTION LAYER` cuối `<script>`.

## Kết nối dữ liệu thật từ Pancake POS

Website là file tĩnh trên GitHub Pages nên **không gọi API Pancake trực tiếp từ trình duyệt** (sẽ lộ API key — key này truy cập được cả đơn hàng/khách hàng — và Pancake không mở CORS cho domain lạ). Thay vào đó, dữ liệu được đồng bộ định kỳ vào chính `index.html` bằng GitHub Actions:

```
Pancake POS API  ──►  scripts/pancake-sync.mjs  ──►  index.html (const PRODUCTS)
(GET /shops/<id>/products)      (GitHub Actions, cron 30 phút)      ──►  GitHub Pages tự deploy
```

- API key chỉ nằm trong **GitHub Secrets**, không xuất hiện trong file public.
- Nếu API lỗi / không có sản phẩm hợp lệ, script thoát lỗi và **không ghi đè** — website cũ vẫn nguyên.
- Snapshot dữ liệu lần sync gần nhất nằm ở `data/pancake-products.json` để dễ đối chiếu.

### Cài đặt (3 bước)

1. **Tạo API key**: Pancake POS → **Cấu hình → Cấu hình ứng dụng → API KEY → Thêm mới**. Nên tạo key riêng cho website để có thể thu hồi bất cứ lúc nào.
2. **Lấy SHOP_ID**: xem trong URL/Thông tin shop của Pancake POS, hoặc kiểm tra bằng lệnh:
   ```bash
   curl "https://pos.pages.fm/api/v1/shops/<SHOP_ID>/products?api_key=<API_KEY>&page_size=1"
   ```
   Kết quả có `"success": true` là đúng.
3. **Thêm secrets**: repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**
   - `PANCAKE_SHOP_ID`
   - `PANCAKE_API_KEY`

   Sau đó vào **Actions → “Sync Pancake POS products” → Run workflow**. Lần chạy đầu tiên sẽ thay dữ liệu mẫu bằng sản phẩm thật, commit và Pages tự cập nhật.

### Map dữ liệu

Sửa `scripts/pancake.config.json`:

| Site | Nguồn Pancake |
|---|---|
| `name` / mô tả | `product.name`, `product.description` (đã strip HTML) |
| `cat` | `categories[].name` → map sang `dam/ao/set/khoac/quan/phukien` (`categories.byName` hoặc `byId`) |
| `brand` | `brand_id` → `brands` (map ID → tên); mặc định `brandFallback` |
| `price` | giá thấp nhất trong `variations[].retail_price` (bỏ variation ẩn) |
| `sizes` / `colors` | `product_attributes` (thuộc tính “Size”, “Màu/Color”) |
| `img` | `images[0]` (dùng trực tiếp CDN Pancake, không nhúng base64) |
| `tag` / `isNew` | `tags[]` theo `tags` keywords; `inserted_at` trong `newDays` ngày |
| `was` (giá gạch), `nameEn`, `descEn`, `tag` tuỳ chỉnh | `overrides["<product-id>"]` |

- Sản phẩm **ẩn/chưa publish** hoặc **danh mục chưa map** sẽ bị bỏ qua (log hiện trong Actions).
- Muốn thêm danh mục mới: map về 1 trong 6 danh mục đang có để khớp bộ lọc UI; nếu cần danh mục mới hoàn toàn thì phải bổ sung chip lọc trong `index.html`.
- Ảnh lỗi tải (CDN xoá ảnh) sẽ hiển thị placeholder chữ ALMIRA thay vì ảnh vỡ.

### Chạy thử không cần API key

```bash
node scripts/pancake-sync.mjs --mock scripts/fixtures/pancake-products.sample.json --out /tmp/test-index.html
```

### Tuỳ chọn nâng cao

- **Gần thời gian thực hơn**: dùng Pancake webhook → một relay nhỏ (Cloudflare Worker) → gọi `repository_dispatch` để chạy sync ngay, hoặc Worker cache + proxy API cho website (API key vẫn giữ kín).
- **Đẩy đơn hàng vào Pancake POS**: cần backend/proxy (Cloudflare Worker, Vercel) gọi `POST /shops/<SHOP_ID>/orders`; không thể gọi từ trình duyệt vì lộ API key.
- **Chỉnh tần suất sync**: sửa `cron` trong `.github/workflows/sync-pancake.yml` (mặc định 30 phút/lần).

### Ghi chú với catalog thật (đã kiểm thử 253 sản phẩm)

- **Ảnh** lấy từ `variations[].images` (nhiều sản phẩm Pancake không có ảnh ở cấp product).
- **Màu/Size** lấy từ `variations[].fields` vì `product_attributes` của Pancake là danh sách dùng chung toàn shop (có thể 50+ màu).
- **Brand**: map `brand_id` nếu có → tách tiền tố viết hoa trong tên (vd `AOORAA`, `4MUGGLE`) → suy ra từ `custom_id` (vd `SUNSETPARK01`) → còn lại dùng `brandFallback`.
- **Tên sản phẩm** được rút gọn: bỏ đoạn trong 【…】/[…], bỏ ngoặc kép, bỏ tiền tố brand, cắt tối đa 78 ký tự (`name.maxLength`). Card chỉ hiển thị 2 dòng, hover xem tên đầy đủ.
- **Giá**: lấy giá thấp nhất trong các variation đang bán. Sản phẩm không có variation/giá sẽ bị bỏ qua (log `no-price`).
- **Phân trang**: website hiển thị 24 sản phẩm/lần, nút “Xem thêm” tải tiếp — phù hợp catalog vài trăm sản phẩm.
- Danh mục chưa map hoặc sản phẩm bị bỏ qua đều được log rõ trong GitHub Actions.

### Logo thương hiệu

- Huy hiệu (bướm + khung hoa văn) được tách từ avatar Facebook chính thức của shop (`facebook.com/almira.studiooo`), nền đã làm trong suốt.
- Nhúng trực tiếp dạng base64 trong `index.html`: badge cạnh tên shop ở hero, logo màn hình intro và favicon/apple-touch-icon — site vẫn là single-file, không phụ thuộc file ngoài.
- Muốn đổi logo: tạo ảnh vuông nền trong suốt, thay chuỗi base64 trong `index.html` (tìm `data:image/webp;base64` và `data:image/png;base64`).
