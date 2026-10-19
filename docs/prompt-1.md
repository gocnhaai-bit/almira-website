# Prompt triển khai Almira Website trên Cloudflare

Bạn đang làm việc trong repo `/Users/dominium/orca/almira-website`.

Nhiệm vụ: nâng cấp website hiện có thành hệ thống bán hàng trên Cloudflare, đồng bộ catalog từ Pancake POS và chuyển đơn đặt từ website vào Pancake POS.

Đây là dự án hiện hữu. Đọc code và hướng dẫn áp dụng trước, bảo toàn giao diện và tính năng đang có. Không khởi tạo lại dự án hoặc tự viết lại frontend sang framework khác.

## 1. Kiến trúc và phạm vi

- Giữ repo Website độc lập với Almira Finance.
- GitHub chỉ lưu source code, migration, test và tài liệu; không dùng GitHub Pages làm hosting đích hoặc GitHub Actions làm tiến trình đồng bộ nghiệp vụ định kỳ.
- Không commit dữ liệu đơn hàng, khách hàng, secret hoặc raw payload vào Git.
- Có thể dùng Cloudflare Workers Builds để build source từ GitHub; việc bật tự động deploy production phải được phê duyệt riêng.

Kiến trúc mục tiêu:

- Cloudflare Workers Static Assets phục vụ frontend hiện có.
- Cloudflare Worker TypeScript xử lý API, validation và tích hợp. Có thể dùng Hono nếu giúp tổ chức code rõ ràng.
- Cloudflare D1 lưu catalog đã chuẩn hóa, yêu cầu đặt hàng, trạng thái đồng bộ, idempotency và outbox/job cần thiết.
- Cron Trigger đồng bộ catalog định kỳ.
- Chọn Queues hoặc dispatcher phù hợp sau khi kiểm tra giới hạn, chi phí và yêu cầu vận hành; không tự bật dịch vụ trả phí.
- R2 chỉ bổ sung khi có nhu cầu lưu ảnh/file thực tế.

Domain mục tiêu: `almirastudio.vn`. Domain đã dùng Cloudflare DNS, nhưng phải kiểm tra cấu hình hiện hữu trước khi đề xuất thay đổi. Không giả định website đã hosting trên Cloudflare.

Ưu tiên frontend và `/api` cùng origin. Tách local, staging và production bằng tài nguyên và secret riêng. Preview/staging không được tự kết nối binding hoặc credential production.

## 2. Bảo toàn website hiện có

- Giữ thiết kế, nội dung song ngữ, mobile, accessibility và motion hiện tại.
- Giữ trang sản phẩm, bộ lọc, giỏ hàng và checkout.
- Không bắt buộc React/Vite/Tailwind nếu frontend hiện tại đáp ứng yêu cầu.
- Tạo thư mục build output riêng và chỉ deploy tài nguyên public được allowlist.
- Không deploy cả repo root làm static assets; không đưa `.env`, script nội bộ, fixture, tài liệu hay dữ liệu riêng tư lên CDN.

## 3. Catalog Pancake

- Đọc script đồng bộ hiện tại và tái sử dụng mapping phù hợp.
- Xác minh tài liệu API chính thức, pagination, giới hạn và quyền credential.
- Đồng bộ sản phẩm/biến thể bằng API chỉ đọc.
- Giữ mapping ổn định giữa product ID, variation ID và shop ID của Pancake.
- Chỉ công khai các trường catalog đã được duyệt. Không đưa raw API, ghi chú nội bộ, giá vốn, dữ liệu khách hàng hoặc API key vào frontend/endpoint công khai.
- Chỉ công bố snapshot mới khi đồng bộ hoàn tất và hợp lệ; lỗi phải giữ snapshot thành công gần nhất.
- Có `lastSuccessfulSyncAt`, trạng thái lỗi đã che thông tin nhạy cảm và cảnh báo dữ liệu cũ.
- Chỉ dùng webhook Pancake sau khi xác minh khả năng thực tế.
- Loại bỏ việc phải commit lại HTML mỗi lần sản phẩm thay đổi.

## 4. Checkout và tạo đơn Pancake

Người dùng yêu cầu: đơn đặt từ website được chuyển vào Pancake POS để shop xử lý.

Website được tạo đơn mới trong Pancake sau gate kết nối thật. Không tự bổ sung sửa/hủy đơn, đánh dấu đã thanh toán, chuyển tiền hoặc thao tác xuất hàng/giao vận. Quyền tạo đơn mới này chỉ áp dụng cho Website; Finance vẫn chỉ đọc Pancake.

### Validation và giá

- Browser gửi sản phẩm/variation, số lượng và thông tin nhận hàng.
- Backend xác minh dữ liệu và tính lại giá/tổng tiền bằng dữ liệu tin cậy; không tin giá, giảm giá, tổng tiền hoặc trạng thái thanh toán từ client.
- Kiểm tra thay đổi giá, biến thể ngừng bán và độ mới của catalog. Nếu không thể xác minh, yêu cầu khách xác nhận lại hoặc fail closed.
- Bảo toàn cách diễn đạt cọc 50% và chính sách hiện hành; chưa có engine khuyến mại thì không tự tạo ưu đãi/phí.
- Không coi catalog là cam kết tồn kho hoặc đã giữ hàng.

### Tiếp nhận bền vững

- Tạo `websiteOrderId` và idempotency key ổn định.
- D1 lưu yêu cầu đặt hàng và outbox/job trong cùng atomic transaction/batch.
- Cùng idempotency key, khác payload: trả conflict. Cùng key và payload: trả cùng yêu cầu đặt hàng.
- Dùng khóa/lease và unique constraints để chống xử lý đồng thời.
- Có dispatcher phục hồi outbox chưa gửi nếu publish queue bị lỗi.
- Không giữ trạng thái chống trùng chỉ trong bộ nhớ Worker.

### Tạo đơn trong Pancake

- Xác minh endpoint, payload, mapping variation, kho/shop, trạng thái đơn ban đầu và quyền API từ tài liệu chính thức.
- Ưu tiên credential riêng, quyền tối thiểu; xác minh quyền thực tế.
- Nếu API hỗ trợ external reference/idempotency, sử dụng `websiteOrderId`.
- Lưu Pancake order ID khi xác nhận tạo thành công.
- Trạng thái nội bộ phải phân biệt: đã tiếp nhận, chờ đồng bộ, đang gửi, đã đồng bộ, lỗi có thể thử lại, kết quả chưa xác định và cần xử lý thủ công.
- Nếu timeout sau khi gửi có khả năng đã tạo đơn: tra cứu/đối chiếu bằng cơ chế API hỗ trợ trước khi retry.
- Nếu API không hỗ trợ chống trùng hoặc tra cứu đủ tin cậy, không hứa exactly-once và không blind retry. Đưa kết quả không xác định vào hàng chờ kiểm tra thủ công.
- Không tuyên bố có atomic transaction chung giữa D1 và Pancake.

### Giao diện

- Chỉ báo “đã tiếp nhận yêu cầu” khi D1 đã lưu thành công.
- Chỉ báo “đã chuyển sang Pancake” khi có xác nhận tương ứng.
- Không báo đã thanh toán hoặc đã được shop xác nhận nếu chưa có bằng chứng.
- Khách tra trạng thái bằng mã/token không đoán được; không cho dò dữ liệu người khác bằng order ID tuần tự.

## 5. Tiền và thanh toán

- Truyền tiền dưới dạng decimal strings.
- Tính bằng thư viện decimal tương thích Workers; không dùng `Number`/`parseFloat` cho phép tính tiền.
- D1 không dùng `REAL` cho số tiền; thiết kế decimal `TEXT` chuẩn hóa và validation rõ ràng.
- Tổng tiền cuối do backend tính và lưu snapshot bất biến lúc đặt hàng.
- Thanh toán ngân hàng/PayPal chỉ giữ đúng khả năng đã có. Không suy ra đã nhận tiền từ việc khách bấm nút hoặc gửi ảnh.
- Không tự bổ sung cổng thanh toán/chuyển tiền trong phạm vi này.

## 6. Bảo mật và vận hành

- Secret chỉ ở cơ chế quản lý secret phía server; không yêu cầu dán vào chat.
- Validation, parameterized queries, chống XSS/CSRF phù hợp, giới hạn body và rate limiting cho đặt hàng/tra trạng thái.
- Có thể dùng Turnstile nhưng phải xác minh token phía server.
- API quản trị đồng bộ, retry và xem đơn phải có xác thực/phân quyền.
- Không đưa PII, token, API key hoặc URL chứa credential vào log.
- Mô tả chính sách lưu trữ/xóa PII trước production.
- Không cache API đơn hàng hoặc dữ liệu khách hàng trên CDN/service worker.
- R2 nếu dùng phải tách tài nguyên public và private.

## 7. Quy trình và gate

1. Đọc repo, báo hiện trạng và kiến trúc đề xuất.
2. Thực hiện code, migration, local tests và staging preparation.
3. Kiểm thử bằng fake transport/fixture cục bộ; không tạo đơn giả trong shop Pancake thật.
4. Không reset database hoặc phá migration/dữ liệu hiện hữu.
5. Chuẩn bị cấu hình Cloudflare, danh sách tài nguyên, chi phí, migration, backup/rollback và thay đổi DNS cụ thể.
6. Trước khi thay đổi DNS/hạ tầng live, bật production, dùng credential thật hoặc tạo đơn trên shop thật: trình kết quả review được và lấy chấp thuận riêng.
7. Không mở giao diện nhận đơn thật khi tuyến xử lý đơn chưa được kiểm chứng.

## 8. Tiêu chí hoàn thành

- Giao diện hiện tại hoạt động trên runtime mục tiêu.
- Catalog cập nhật không cần commit dữ liệu vào Git.
- Checkout lưu yêu cầu bền vững, không báo thành công giả.
- Test retry, concurrent duplicate, crash recovery, timeout không xác định, sai shop/variation và thay đổi giá.
- Không lộ credential/PII qua assets, API, log hoặc Git.
- Có hướng dẫn local, staging, deploy, quản trị lỗi và rollback.
- Báo rõ những gì đã chạy thật, chỉ kiểm thử local và còn bị gate.
- Chỉ báo URL production hoặc đơn Pancake thành công sau khi xác minh.

Bắt đầu bằng việc đọc repo và đề xuất kế hoạch triển khai ngắn, sau đó chủ động hoàn thành các phần local được phép. Không dừng chỉ để xin phép đọc/code/test đã nằm trong phạm vi.