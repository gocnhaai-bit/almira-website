# Tiến độ hoàn thiện catalog và gate checkout

Ngày2026-10-19. Nhánh `fix/catalog-brand-source`.

## Catalog
- Nguyên nhân nhãn thương hiệu: endpoint variation cung cấp `product.display_id`, không có `custom_id`. Đã xác minh live với mã SELFMING03; sửa fallback một dòng, không hardcode30 product ID.
-27 test, bootstrap, typecheck và build đạt; review độc lập không thấy defect cụ thể.
- Worker bản736967d2 đã deploy12:23 Asia/Saigon. Chưa kích hoạt sync thủ công sau deploy để giữ bằng chứng generation tự động.
- Catalog hiện vẫn active generation12:07–12:09. Generation kế tiếp dự kiến bắt đầu12:38, đủ22 trang khoảng13:00 nếu Cron chạy đạt. Hẹn kiểm tra13:04 session-only.
- Thay đổi source và tài liệu trong nhánh chưa commit/push, không tự suy diễn chấp thuận commit mới từ yêu cầu tiếp tục triển khai.

## Checkout kiểm tra lúc12:25
- Production D1 orders=0.
- Có secret ADMIN_TOKEN, ORDER_TOKEN_SECRET và PANCAKE_READ_API_KEY; không có secret ghi PANCAKE_WRITE_API_KEY.
- Chưa cấu hình PANCAKE_WAREHOUSE_ID; CHECKOUT_ENABLED=false, PANCAKE_WRITE_ENABLED=false.
- Không tạo đơn thật, không dùng thông tin khách thật. Chính sách PII30 ngày vẫn là đề xuất chưa duyệt.

## Cần quyết định để kiểm chứng tạo đơn
Sếp chỉ định shop/môi trường thử được duyệt và kho. Nếu shop đang bán, chỉ kiểm chứng bằng một yêu cầu mua thật được Sếp chọn, không tạo đơn giả vào shop kinh doanh. Key ghi phải nhập trực tiếp vào Cloudflare, kiểm tra quyền tối thiểu. Trước request tạo đơn cần trình payload đã che PII, trạng thái New, không thanh toán/giao vận, dự kiến giá và lấy phê duyệt cụ thể. Chưa mở checkout công khai.
