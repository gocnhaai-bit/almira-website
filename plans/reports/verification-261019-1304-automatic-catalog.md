# Kiểm chứng tự động catalog và thương hiệu

Ngày2026-10-19, múi giờ Asia/Saigon. Chỉ GET catalog public và SELECT D1; không gọi admin sync, không sửa D1, không tạo đơn trong lượt kiểm chứng.

## Kết quả
- Generation tự động bắt đầu12:38:07, hoàn tất12:59:06.972 qua22 trang; snapshot chuyển active, generation trước retired.
- Generation kế tiếp đến hạn13:08:07, đúng30 phút tính từ lần bắt đầu12:38:07. Cron xử lý checkpoint mỗi phút; không phải publish mỗi phút. Thời gian xử lý generation vừa quan sát khoảng21 phút.
- Public catalog243 sản phẩm /953 biến thể;243 ID trùng legacy,0 ID mới,4 ID bị loại vì tất cả biến thể bị khóa (đã xác minh POS trong phiên trước).
- Với243 ID chung:0 khác biệt thương hiệu,0 khác biệt giá (so sánh decimal),0 khác biệt danh mục so với snapshot legacy commit3f2ba5a.
- `lastSuccessfulSyncAt=2026-10-19T05:59:06.972Z`, `stale=false`, `error=null`, `checkoutEnabled=false`.
- Lỗi30 nhãn thương hiệu đã hết trên catalog public nhờ đọc `display_id` khi không có `custom_id`. Review độc lập trước đó DONE, không còn pending.

## Giới hạn bằng chứng
Đã chứng minh một generation tự động hoàn tất và lịch kế tiếp30 phút; chưa phải cam kết mọi generation tương lai đều hoàn tất dưới30 phút nếu catalog/giới hạn dịch vụ đổi. Chưa đo CPU percentile, không tuyên bố ngân sách Free đã được benchmark đầy đủ. Không kiểm chứng hoặc mở luồng tạo đơn từ kết quả catalog này.

## Nguồn kiểm chứng
- GET https://almirastudio.vn/api/catalog, chỉ giữ catalog và snapshot legacy trong bộ nhớ khi đối chiếu.
- `catalog_state`: thời điểm hoàn tất/next_sync_at/page/error; `catalog_snapshots`: created_at/status, truy vấn SELECT remote D1.
- Snapshot legacy `git show 3f2ba5a:data/pancake-products.json`.
