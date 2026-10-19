# Kết quả triển khai Cloudflare sales — local

Ngày: 2026-10-19. Nhánh: `feat/cloudflare-sales`. Phạm vi: [plan](../261019-1029-cloudflare-sales/plan.md). Chưa commit/push/deploy.

## Đã triển khai
- Static build allowlist, Worker TypeScript cùng origin, D1 schema và backup/migration local không reset.
- Đồng bộ catalog phân trang, checkpoint/lease, snapshot publication atomic, mapping variation/shop ổn định, decimal strings, freshness và lỗi đã che nhạy cảm. Bỏ snapshot catalog trong HTML/Git và workflow đồng bộ nghiệp vụ GitHub.
- Quote máy chủ, tiếp nhận order + outbox atomic, unique idempotency, lease dispatcher và phục hồi sau crash. Unknown sau gửi không tự retry. Admin auth/reconcile, tra cứu bằng token bí mật, API no-store và validation/body/rate limits.
- Frontend giữ UI, hash routes và modules classic; catalog load/retry/stale, variation chính xác, BigInt hiển thị tiền, quote review trước gửi, status trung thực. Payment preference không chứng minh thanh toán.
- Hướng dẫn local/staging/chi phí/gate/PII/backup/rollback tại [operations](../../docs/operations.md).

## Đã chạy thật ở local
- `npm run check`: typecheck đạt; 26 test Workers/D1 đạt; bootstrap/refresh invariant đạt; build allowlist đạt.
- `npm run deploy:check`: Wrangler staging dry-run đạt; D1 staging placeholder riêng, toàn bộ gate tắt; không upload/deploy live.
- `npm audit`: không phát hiện vulnerability trong dependency đã khóa tại thời điểm chạy.
- `git diff --check`, syntax scripts: đạt.
- Migration local mới và migration bổ sung áp dụng thành công; backup state trước lần bổ sung. Backup nằm ngoài Git/CDN.
- Browser riêng trên Worker local: route sản phẩm trực tiếp; chặn size/màu không có thật; thêm variation đúng; checkout hai bước/focus; cọc lẻ chính xác; gate off disabled; EN/mobile 390x844 không tràn ngang; reduced-motion được bật; quote cần xác nhận riêng trước response tiếp nhận; pending không báo synced; tra unknown khi giỏ trống; catalog lỗi và thử lại cập nhật grid.
- Browser dùng network interception + dữ liệu tổng hợp, không gọi POS thật hoặc ghi đơn thật. Hình fixture không đại diện catalog kinh doanh.
- GET đường dẫn tài liệu nội bộ qua local assets trả 404. Output chỉ chứa allowlist public; không docs, fixture, package/source Worker hay config nội bộ.
- Hai lượt review độc lập backend không tìm lỗi cụ thể còn tồn tại; review frontend tìm stale catalog reference, đã sửa và kiểm thử bootstrap/browser. Các lỗi tích hợp khác được xử lý trong phiên, không giấu test thất bại ban đầu.
- Đã đóng browser và dev server do phiên này khởi động sau kiểm thử.

## Chưa chạy / còn gate
- Chưa tạo tài nguyên Cloudflare thật, chưa áp migration remote hoặc deploy staging/production.
- Chưa dùng credential Pancake thật, chưa xác minh quyền thực tế/quota/shop/kho, create payload và response với tài khoản được duyệt.
- Không tạo đơn giả trong shop thật. Không tuyên bố exactly-once, không giả định `custom_id` unique hoặc lookup hoàn chỉnh.
- Chưa đo CPU Cron trên Cloudflare Free. Sync phân trang có giới hạn nhưng ngân sách CPU10ms vẫn cần đo staging; không tự bật gói trả phí.
- Chưa thay DNS/route. DNS công khai proxy Cloudflare không đủ kết luận hosting gốc; cần kiểm tra dashboard/export trước cutover.
- Chính sách PII30 ngày sau synced là đề xuất, cần Sếp duyệt; chưa có job tự xóa PII đã bật.
- Không tự bật nhận đơn thật hoặc auto-deploy production. Cần duyệt hạ tầng, credential, đơn kiểm chứng và production riêng.

## Ghi chú công cụ
`ak` CLI chưa cài; cập nhật plan và nhật ký trực tiếp dưới `plans/`. Context7 không tìm được tài liệu truy vấn; dùng OpenAPI Pancake và tài liệu Cloudflare chính thức thay thế. Gói `@cloudflare/vitest-pool-workers` đã deprecated, thay bằng `@cloudflare/vitest-plugin` hiện hành. Không sửa quyền hay config global để vượt công cụ bị chặn.

## Quyết định còn cần Sếp
Duyệt môi trường/tài nguyên và chi phí; shop thử nghiệm/credential tối thiểu; chính sách lưu/xóa PII; trình tự kiểm chứng thật, DNS và thời điểm bật production.
