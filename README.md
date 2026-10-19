# Almira Studio — Website

Website thời trang song ngữ Việt/Anh, giữ frontend HTML/CSS/JavaScript hiện hữu và bổ sung Cloudflare Workers + D1 cho catalog và yêu cầu đặt hàng.

## Bắt đầu

- Yêu cầu và giới hạn nghiệp vụ: [docs/prompt-1.md](docs/prompt-1.md).
- Local, staging, bảo mật, quản trị lỗi, backup/rollback và gate production: [docs/operations.md](docs/operations.md).
- Lệnh thực thi: [package.json](package.json); tài nguyên và các cờ bật/tắt: [wrangler.jsonc](wrangler.jsonc).
- Static output được allowlist trong [scripts/build.mjs](scripts/build.mjs); không deploy repo root.

```sh
npm ci
npm run db:migrate
npm run dev
```

Mặc định các kết nối Pancake và tiếp nhận đơn đều tắt. Không có catalog giả tự xuất hiện khi chưa đồng bộ. Bộ test dùng dữ liệu tổng hợp và transport cục bộ; không cần credential thật.

## Ranh giới quan trọng

- Giữ hash routes, giỏ hàng theo phiên, checkout hai bước, song ngữ và reduced-motion. Frontend không giữ secret và không gọi Pancake trực tiếp.
- Catalog cập nhật qua Worker/Cron vào D1, không commit dữ liệu mỗi lần sản phẩm đổi. GitHub Actions chỉ kiểm tra mã, không chạy nghiệp vụ định kỳ hay tự deploy production.
- Giá hàng và cọc 50% do backend tính chính xác; phí giao/ưu đãi chưa xác nhận không được coi là đã chốt. Catalog không phải cam kết tồn kho hoặc giữ hàng.
- “Đã tiếp nhận” khác với “đã chuyển sang Pancake”; cả hai đều không chứng minh thanh toán. Timeout sau khi gửi phải đối chiếu, không tự tạo lại đơn.
- Website được tạo đơn mới sau gate kết nối thật; không sửa/hủy đơn, đánh dấu đã thanh toán hoặc thực hiện giao vận. Almira Finance nằm ngoài repo và vẫn chỉ đọc.
- Credential thật, tài nguyên live, DNS, production và đơn trên shop thật cần phê duyệt riêng.

## Giao diện và tài nguyên

Các module tại `assets/` giữ thiết kế hiện hữu. Cấu hình đích thanh toán công khai tại [assets/payment-config.js](assets/payment-config.js): chỉ số tài khoản/người nhận và link PayPal, không API secret. Khi chưa cấu hình, phương thức tương ứng không khả dụng; không tự xác minh giao dịch.

Ảnh biên tập dùng sản phẩm thật, nguồn đối chiếu tại [assets/editorial/sources.json](assets/editorial/sources.json). Logo dùng [assets/almira-emblem.webp](assets/almira-emblem.webp). Không tự thay bằng dữ liệu/ảnh demo khi thiếu catalog.
