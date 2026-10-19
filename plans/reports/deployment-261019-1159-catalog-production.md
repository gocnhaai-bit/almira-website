# Kiểm chứng catalog production

Ngày: 2026-10-19. Nhánh cấu hình: `feat/cloudflare-catalog-deployment`.

## Đã xác minh thật
- Sếp duyệt dùng key Pancake hiện có, nhập trực tiếp vào Cloudflare; chỉ tên secret được kiểm tra, không đọc giá trị.
- D1 `almira-production` đã được sao lưu trước migration và thay đổi tiến trình sync; backup riêng trong thư mục bị Git ignore.
- Worker đã hoàn tất một generation: 1.974 variation nguồn được đọc qua 22 trang; 243 sản phẩm/953 variation vượt mapping/publication validation. Không công bố raw/internal fields. Chưa kết luận tương đương hoàn toàn 247 sản phẩm legacy; khác biệt mapping cần đối chiếu thêm nếu có mẫu thiếu.
- Snapshot công bố lúc 2026-10-19 12:09:00 Asia/Saigon. Catalog API `stale=false`, `error=null`.
- Theo chấp thuận riêng của Sếp, route `almirastudio.vn/*` chuyển tới Worker `almira-production`; không sửa bản ghi DNS. API domain thật trả 243 sản phẩm; homepage HTTP200.
- Browser domain thật hiển thị 24 card trang đầu, globals nhận243 sản phẩm, không cảnh báo cũ. Browser kiểm thử đã đóng.
- Cron mỗi phút xử lý checkpoint; chu kỳ generation dự kiến30 phút tính từ lúc bắt đầu generation, không cộng thêm thời gian xử lý. Trang90 để22 trang hoàn tất trong khoảng22 phút ở lần chạy tự động nếu mỗi invocation đạt. Lần sync vừa rồi tăng tốc bằng endpoint admin, chưa phải bằng chứng toàn chu kỳ Cron tự động.
- 26 test + bootstrap + typecheck + build qua sau thay đổi. Thêm assertion next_sync_at theo thời điểm bắt đầu.
- Redirect transport chuyển từ error sang manual và từ chối3xx bằng mã an toàn. Không theo redirect mang key sang host khác.

## Chưa hoàn tất
- Phải theo dõi một generation tự động đầy đủ để xác minh ngân sách CPU Free và cập nhật thực tế30 phút; không tuyên bố đã chứng minh chỉ từ cấu hình Cron.
- Đối chiếu243 sản phẩm mới với247 legacy để giải thích sản phẩm bị bỏ qua, không tự nới điều kiện công khai.
- Git nhánh triển khai có thay đổi chưa commit/push, trong khi code runtime đã deploy theo phê duyệt live.
- Chưa cấu hình www; route được duyệt chỉ apex.
- Nhận đơn/gửi đơn vẫn tắt, chưa có key ghi hoặc đơn thật. Phần checkout production chưa hoàn tất.

## Rollback
Bỏ route apex để về origin GitHub Pages hiện hữu (bản mới trên Pages không có API; muốn rollback dùng storefront cũ đã kiểm chứng và không tự kích hoạt sync Git nghiệp vụ). Giữ D1, không restore outbox mù quáng. Không có thay đổi DNS để đảo.
