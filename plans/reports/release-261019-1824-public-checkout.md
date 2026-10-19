# Mở nhận đơn công khai — 2026-10-19

Chủ shop phê duyệt trực tiếp: “ok duyệt mở nhận đơn nhé”.

- Bật production CHECKOUT_ENABLED=true và PANCAKE_WRITE_ENABLED=true; CHECKOUT_TRIAL_ENABLED=false. Local/staging vẫn tắt. Không đổi credential/shop/kho, không migration/reset hoặc gửi lại đơn cũ.
- Trước deploy: SELECT D1 một order synced và một outbox done, không có công việc chờ gửi. Lần đọc đầu lỗi quyền7403; sau kiểm tra OAuth đúng tài khoản, đọc lại thành công. Bốn secret cần thiết vẫn có mặt, không đọc/in giá trị.
- npm run check:46 test PASS, bootstrap/typecheck/build PASS.
- Production version2701548c-ad1a-49d3-a963-3ba6081ddae5, triển khai thành công.
- Sau deploy: GET catalog apex HTTP200,243 sản phẩm, stale=false, checkoutEnabled=true, checkoutTrial=false. POST quote một biến thể public HTTP200, quote có chữ ký và giá bằng giá máy chủ. Không ghi quote token vào log/file.
- Không POST tạo đơn thử vào shop thật. Bản sửa UUID đã được kiểm thử local; lần mua thật tiếp theo mới là xác nhận create production sau bản sửa. Không tuyên bố đã có giao dịch thật mới.
- Nhận đơn không đồng nghĩa xác nhận thanh toán hoặc giao vận. Cấu hình số tài khoản/PayPal public vẫn chưa có đích nhận tiền; không bật hay tuyên bố thanh toán trực tuyến đã sẵn sàng.
- Chính sách PII30 ngày sau synced thực hiện qua purge quản trị, chưa tự động; dữ liệu Pancake/backup xử lý riêng như operations.md.
- Rollback intake: tắt CHECKOUT_ENABLED; đánh giá hàng chờ trước khi đổi PANCAKE_WRITE_ENABLED. Không reset unknown hoặc restore toàn DB mù quáng.
