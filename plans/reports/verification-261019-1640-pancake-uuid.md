# Xác nhận UUID Pancake — 2026-10-19

## Đã hoàn tất
- Dùng chung bộ kiểm tra identity cho create response và reconcile GET: API ID số hoặc UUID; đúng shop; custom_id có giá trị phải khớp website ID, thiếu/null/rỗng chỉ chấp nhận API ID bằng website UUID. Không dùng system_id hoặc note để thay identity.
- Reconcile nhận tối đa 36 ký tự, chặn ID sai định dạng trước request mạng. Phản hồi HTTP lỗi/redirect/không khớp vẫn không được synced; unknown không được retry tự động.
- 46 test Workers runtime PASS; bootstrap catalog, typecheck, build, production dry-run PASS. Bao gồm UUID phẳng/wrapped, UUID riêng có custom reference, sai shop/reference/UUID, unsafe numeric ID, malformed body và reconcile input; kiểm tra không gửi lại sau synced/unknown.
- Đã deploy production version `9522d460-d67f-401c-a289-bad709cb818d`; checkout/trial/write đều false, catalog read true. Không migration, không sửa dữ liệu đơn, không tạo đơn Pancake.
- Sau deploy: apex và workers.dev homepage/catalog HTTP200; 243 sản phẩm, stale=false, error=null, checkoutEnabled=false, checkoutTrial=false. POST quote rỗng trả503 checkout_unavailable ở cả hai host.
- SELECT D1 trước deploy: một order synced, một outbox done, không có pending/sending/unknown. Không ghi PII/raw response/secret.

## Giới hạn và việc chờ
- Bằng chứng UUID mới là kiểm thử local transport tổng hợp theo dạng đã quan sát ở đơn806; chưa tạo thêm đơn thật sau bản sửa. Không suy diễn test local là kiểm chứng create API production mới.
- OpenAPI chính thức vẫn mô tả response id integer; runtime trước đó đã quan sát UUID. GET order path khai báo ORDER_ID string. Nguồn: https://docs.pancake.biz/pos/api/openapi.json (đọc lại trong lượt này).
- Chưa mở nhận đơn công khai: đang chờ lựa chọn của chủ shop về chính sách PII và mở nhận đơn. Chính sách30 ngày là thao tác purge quản trị, chưa có lịch tự động; không tuyên bố đã tự xóa Pancake/backup.
- Đơn806 không gửi lại. Nếu cần kiểm chứng create thật lần nữa, dùng một giao dịch mua thật được chủ shop chỉ định; không reset suất trial/xóa đơn hoặc tạo đơn giả.
