# Vận hành Cloudflare và Pancake

## Nguồn cấu hình

[wrangler.jsonc](../wrangler.jsonc) là cấu hình runtime; [package.json](../package.json) là danh sách lệnh; [migrations](../migrations/) sở hữu schema. Production dùng D1 riêng và route apex `almirastudio.vn/*`; local và staging tách binding. ID staging vẫn là placeholder, chưa tạo tài nguyên staging. Catalog production được phép đọc Pancake; checkout và ghi đơn vẫn tắt. Preview và Workers Builds tự deploy chưa bật.

Chọn D1 outbox + Cron thay Queues vì lượng đơn ban đầu chưa chứng minh cần thêm dịch vụ. Đơn được thử chuyển sau khi lưu; Cron phục hồi công việc còn chờ. Đổi lại, công việc gián đoạn có thể chờ lượt chạy tiếp theo. Không có giao dịch atomic chung giữa D1 và Pancake.

## Local không dùng credential thật

```sh
npm ci
npm run check
npm run db:migrate
npm run dev
```

Dừng dev server trước backup/migration. `db:migrate` sao lưu state local đã tồn tại trước khi chạy migration; không reset database. Test dùng D1 tạm riêng và dữ liệu tổng hợp, không shop thật. `npm run deploy:check` chỉ build/dry-run, không publish.

Các cờ mặc định tắt: frontend vẫn cho liên hệ shop nhưng không nhận đơn thật; chưa có snapshot thì báo chưa tải được catalog thay vì lấy dữ liệu cũ từ Git. Để kiểm thử đầy đủ mà không gọi Pancake thật, chạy bộ test transport cục bộ tại [tests](../tests/). Không đặt credential production trong local hoặc preview.

## Secret và môi trường

Nhập secret bằng cơ chế secret Cloudflare sau phê duyệt, không dán vào chat, source hoặc CLI argument được ghi lịch sử. Local chỉ dùng file `.dev.vars` bị Git ignore. Tên biến và kiểu sở hữu tại [worker/types.ts](../worker/types.ts):

- `ORDER_TOKEN_SECRET`: khóa ngẫu nhiên tối thiểu 32 ký tự, dùng ký quote/status token và băm khóa giới hạn truy cập. Không xoay khóa khi còn quote/khách cần phục hồi receipt mà chưa có kế hoạch chuyển tiếp.
- `ADMIN_TOKEN`: secret ngẫu nhiên tối thiểu 32 ký tự, chỉ dùng server/terminal quản trị. Không nhập vào UI công khai. Bảo vệ thêm qua Cloudflare Access khi vận hành nếu cần.
- `PANCAKE_READ_API_KEY`, `PANCAKE_WRITE_API_KEY`: ưu tiên key riêng và quyền tối thiểu; tên biến không chứng minh được Pancake thực sự giới hạn quyền. Phải kiểm tra quyền thực tế trước bật.
- Shop/kho phải được xác minh trong đúng môi trường, không lấy mặc định từ catalog cũ hoặc credential Finance.

Staging phải dùng D1 riêng và shop/key thử nghiệm đã được phê duyệt; không dùng binding/credential production. Không tự kích hoạt gói trả phí.

## API quản trị

Hợp đồng thực thi tại [worker/index.ts](../worker/index.ts) và [worker/admin.ts](../worker/admin.ts). Mọi request quản trị cần `Authorization: Bearer <ADMIN_TOKEN>`; token không nằm trong URL. Dùng HTTP client lấy secret từ biến môi trường/private secret store, không ghi vào log hay lịch sử lệnh. API trả `no-store`.

- Sync: mỗi request xử lý một trang và trả trạng thái `page`, `complete`, `not_due`, `busy` hoặc `failed`; chỉ `complete` mới công bố snapshot. Không gọi endpoint này trong khoảng kiểm chứng chu kỳ tự động.
- Xem đơn quản trị: chỉ metadata xử lý và tổng tiền, không công khai người nhận.
- Retry: chỉ công việc chắc chắn chưa gửi và đang pending/retryable; unknown/manual bị từ chối.
- Reconcile: cung cấp Pancake order ID mà nhân sự đã tìm được; backend GET xác minh `shop_id`, `id`, `custom_id` trước khi ghi đã đồng bộ. Không suy ra không tồn tại chỉ vì tìm kiếm không thấy.
- Purge customer: chỉ đơn đã synced, xóa thông tin nhận hàng trong Website; không xóa dữ liệu bên Pancake.

Không đưa raw request/response Pancake hoặc thông tin nhận hàng vào báo lỗi, screenshot, ticket hay Git.

## Khi đơn lỗi hoặc kết quả chưa xác định

`websiteOrderId` là mã yêu cầu Website, không phải chứng nhận thanh toán. Định nghĩa trạng thái và khóa tại [worker/pancake.ts](../worker/pancake.ts), [migrations/0001-sales.sql](../migrations/0001-sales.sql).

1. Pending: kiểm tra cờ gửi, secret/binding, Cron và công việc còn chờ; không tạo đơn thủ công song song rồi bật dispatcher mà không đối chiếu.
2. Sending hết lease, timeout, HTTP lỗi hoặc thiếu xác nhận: coi có khả năng Pancake đã tạo đơn. Đơn chuyển unknown, không retry tự động.
3. Nhân sự tìm trong đúng shop theo website reference và đối chiếu mặt hàng/người nhận. Khi tìm được đơn duy nhất, dùng reconcile để backend kiểm tra mã.
4. Nếu chưa xác định được: giữ nguyên hàng chờ và liên hệ hỗ trợ Pancake. Không có nút “gửi lại dù chưa biết kết quả”. Không hứa exactly-once.
5. Shop/kho sai hoặc snapshot không hợp lệ: xử lý thủ công, không đổi config rồi tự gửi đơn cũ sang shop khác.

Nếu D1 đã lưu nhưng browser mất response, khách thử lại với cùng idempotency key và payload trong phiên trang. Reload có thể mất key/token giữ trong bộ nhớ; không tự đặt lại đơn khi chưa đối chiếu với shop. Cần thông báo khách giữ token đã sao chép, không chia sẻ công khai.

## Catalog và giới hạn

Mapping tại [worker/catalog.ts](../worker/catalog.ts), cấu hình thương hiệu/danh mục tại [scripts/pancake.config.json](../scripts/pancake.config.json). Endpoint biến thể cung cấp mã hàng trong `product.display_id`; dùng làm nguồn suy ra thương hiệu khi `custom_id` không có để giữ quy tắc bản cũ, không đưa mã nguồn này vào payload public. Không dùng ghi chú nội bộ làm mô tả công khai. Snapshot mới chỉ được công bố khi đầy đủ/hợp lệ; lỗi giữ snapshot cũ. Dữ liệu cũ chặn quote mới, không được coi là giữ hàng.

Cron chạy mỗi phút để xử lý checkpoint; generation mới đến hạn sau 30 phút tính từ lúc generation trước bắt đầu. Lịch một phút không có nghĩa publish mỗi phút: chỉ publish khi đọc đủ trang. Thời gian hoàn tất và CPU thực tế phải được kiểm chứng; khi catalog tăng đủ lớn có thể vượt thời gian30 phút và cần điều chỉnh đã được duyệt.

OpenAPI chính thức: <https://docs.pancake.biz/pos/api/openapi.json>. Endpoint catalog cũ GET `/products` không có trong tài liệu đã kiểm tra; adapter dùng `/products/variations`. API có `custom_id` nhưng chưa có bằng chứng unique/idempotency hay tìm kiếm reference đủ tin cậy. Quota và quyền key còn cần xác minh với Pancake.

Cloudflare Free theo tài liệu tham chiếu: Workers 100.000 request/ngày, CPU 10 ms/invocation kể cả Cron, 50 subrequest/invocation; D1 5 triệu rows read/ngày, 100.000 rows write/ngày, tổng storage 5 GB. Static assets không tính phí request. D1 vượt quota Free sẽ lỗi cho đến kỳ reset; ứng dụng không được báo thành công trong trường hợp đó. CPU thực tế cần đo trên staging; chia nhỏ sync không tự chứng minh đáp ứng ngân sách 10 ms. Không tự nâng gói; Workers Paid có mức tối thiểu $5/tháng theo tài liệu, chi phí thật phụ thuộc usage.

Nguồn để kiểm tra lại trước deploy:
- <https://developers.cloudflare.com/workers/platform/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/d1/platform/pricing/>

## Kiểm chứng riêng một đơn mua thật

`CHECKOUT_ENABLED` công khai vẫn tắt. Chỉ bật `CHECKOUT_TRIAL_ENABLED` khi đã có kho được xác minh, key ghi riêng và `CHECKOUT_TRIAL_SECRET` tối thiểu32 ký tự nhập qua Cloudflare. Form trên checkout đổi mã riêng thành cookie HttpOnly/Secure/SameSite=Strict trong một giờ; không gửi mã qua URL hoặc lưu browser storage. Backend kiểm tra phiên và chỉ tiếp nhận một đơn mới khi bảng orders chưa có đơn; replay cùng khóa vẫn trả đơn cũ. Không xóa đơn/reset suất để vượt giới hạn, kể cả khi kết quả gửi chưa xác định.

Sếp tự chọn hàng và xác nhận quote; nhân sự không tạo đơn thay chỉ để thử API. Không đánh dấu đã thanh toán hoặc yêu cầu chuyển tiền cho kiểm chứng. Không mở public checkout sau lượt này nếu chưa có phê duyệt riêng. Secret kiểm chứng và key API không đưa vào chat, Git hoặc tài liệu.

## Chính sách PII trước production

Dữ liệu nhận hàng chỉ dùng xử lý yêu cầu và đối chiếu đơn. Không dùng cho marketing trong phạm vi này. Người có quyền: nhân sự shop được cấp quyền quản trị; không có endpoint public đọc PII. Status token là bí mật của khách, không chứa PII và không nằm trong URL.

Đề xuất giữ PII Website tối đa 30 ngày sau khi xác nhận synced, sau đó purge qua thao tác quản trị; đơn pending/unknown/manual phải đối chiếu trước khi xóa để tránh mất thông tin xử lý. Đây là **đề xuất cần Sếp duyệt trước production**, chưa phải lịch xóa tự động đã bật. Shop cần xác định trách nhiệm yêu cầu xóa, dữ liệu kế toán phải giữ, phạm vi dữ liệu Pancake và thời gian hết hạn backup. Backup có PII phải được bảo vệ và xóa theo chính sách; purge Website không xóa Pancake/backup cũ.

## Staging và production: checklist xin duyệt riêng

1. Review code/test/build và các rủi ro chưa xác minh. Xác minh hosting gốc, DNS record hiện hành qua dashboard/export; public A/AAAA proxy Cloudflare không xác định được origin.
2. Trình tài nguyên: Worker Static Assets, D1 riêng cho từng môi trường, Cron; không Queues/R2. Đánh giá request/CPU/row usage, phí và giới hạn Pancake.
3. Sau chấp thuận hạ tầng: tạo D1 staging riêng, thay đúng placeholder, nhập secret staging theo quyền tối thiểu. Backup và áp migration có kiểm soát; không reset database.
4. Sau chấp thuận credential: thử catalog read-only và đối chiếu quyền/shop/kho/phân trang/độ mới. Thử lỗi trang cuối để chứng minh snapshot cũ còn nguyên.
5. Sau chấp thuận đơn thật: xác minh payload/giá/mapping/status ban đầu, response identity và quy trình unknown với test có kiểm soát trên shop được chỉ định. Không tạo đơn giả trong shop thật để tiện test.
6. Chỉ sau tuyến đặt hàng được kiểm chứng và chính sách PII được duyệt mới bật tiếp nhận đơn. Chỉ bật Workers Builds production tự động khi có duyệt riêng.
7. Đề xuất DNS cụ thể sau khi biết record cũ, route/origin mới và cách khôi phục. Chưa có thay đổi DNS nào được thực hiện chỉ từ cấu hình repo.

## Backup và rollback

- Local: dừng server, chạy `npm run db:backup`; thư mục `backups/` bị ignore. Script migration tự backup state đã tồn tại. Backup file đang ghi không bảo đảm nhất quán.
- Remote: trước mọi migration/data update đã được duyệt, export D1 bằng Wrangler `d1 export ... --remote --output <private-backup>` hoặc checkpoint Time Travel đã xác minh khả dụng; không commit/export lên CDN. Kiểm tra bản backup đọc được và có quy trình restore vào tài nguyên riêng trước cutover.
- Rollback nhanh: đóng checkout/write/read gate phù hợp, giữ D1 và outbox, quay về phiên bản Worker đã kiểm chứng. Không deploy frontend cũ báo chưa gửi trong khi dispatcher vẫn chạy mà không giải thích cho shop.
- Không drop bảng hoặc đảo migration mù quáng. Restore toàn DB có thể hồi sinh outbox đã gửi và làm mất mapping đơn Pancake; phải đóng dispatcher, đối chiếu đơn phát sinh sau backup, kiểm tra unknown trước mở lại.
- Catalog lỗi: giữ con trỏ snapshot thành công, sửa mapping/credential rồi đồng bộ lại. Không xóa snapshot active để thử vận may.

## Bằng chứng phát hành

Lưu báo cáo kiểm chứng trong `plans/reports/`, phân biệt rõ local test, staging test, kết nối thật và gate còn đóng. Không ghi URL production hoặc đơn Pancake thành công nếu chưa xác minh.
