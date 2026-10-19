# Phục hồi đơn mua thật sau lỗi redirect

Ngày2026-10-19. Sếp phê duyệt riêng gửi lại đúng yêu cầu `1eec3403-5f0c-4317-a405-79f959e33310`.

- Nguyên nhân đã tái hiện bằng Workers runtime: `redirect:error` ném TypeError trước khi gửi mạng. Sửa dispatcher/reconcile sang manual; không theo redirect mang secret/PII.32 test/typecheck/build đạt trước deploy.
- Trước phục hồi: order unknown, Pancake ID null, outbox unknown attempts1, không có job pending/leased/sending khác.
- Sao lưu D1 thành công vào private ignored backups trước thay đổi dữ liệu; không hiển thị signed URL.
- Ghi admin_audit action `approved_recovery_pre_send_redirect_error`; đổi duy nhất order/outbox này sang pending bằng điều kiện ID/status/error/attempts, không sửa snapshot giá/người nhận, không tạo yêu cầu mới.
- Bật dispatcher production, checkout/trial vẫn false; phiên bản d7098bd3. Cron sẽ xử lý hàng chờ, chưa khẳng định tạo thành công khi chưa có xác nhận.
- Không reset số attempts, không hứa exactly-once; nếu lần gửi có thể đã tới API mà thiếu xác nhận thì giữ unknown và không retry tiếp.

## Kết quả đối chiếu thật
- Lượt phục hồi nhận JSON nhưng bị bộ kiểm tra cũ từ chối vì giả định ID số và custom_id echo. Không gửi lại lần nữa.
- GET danh sách đơn POS tìm đúng ID UUID bằng websiteOrderId, mã hệ thống806, shop1720091522, trạng thái0(New). Ghi chú chứa reference; product/variation/quantity/price khớp snapshot đã lưu, total1135000VND.
- Đã backup trước reconciliation, ghi audit `verified_pos_system_806_uuid_and_items`, cập nhật D1 synced/outbox done với UUID POS. attempts2 gồm lần đầu lỗi trước mạng và lần phục hồi đã tạo đơn; không suy ra2 đơn.
- Tắt lại dispatcher và checkout/trial; gỡ endpoint đối chiếu tạm. Deployment1f3b62be.
- Còn phải sửa hợp đồng xác nhận/reconcile hỗ trợ UUID POS trước mở nhận đơn công khai. Không đánh dấu thanh toán hoặc shop confirmed; POS vẫn New.
