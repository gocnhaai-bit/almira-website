# Nhật ký triển khai local Cloudflare sales

- Chuyển catalog khỏi HTML/GitHub Actions sang Worker/D1; giữ frontend và các route hiện có.
- Tách classic shop script đã làm mất `CAT_NAMES`; kiểm thử browser tìm ra lỗi và đã khôi phục. Catalog bootstrap ban đầu giữ mảng cũ; đổi sang getter và cập nhật cùng mảng, thêm check chạy được.
- Test D1 ban đầu dùng chung dữ liệu giữa các test; thêm cleanup chỉ trên binding tạm, giới hạn discovery tránh chạy test trong worktree. Không thay/reset local hoặc remote DB để chữa test.
- Catalog giữ lease sau khi xong trang làm trang kế tiếp bị busy; sửa release tại checkpoint, không kéo dài thời gian test để che lỗi.
- Checkout phải hiển thị quote và cần lần xác nhận riêng; giữ idempotency payload khi mất response, không xóa trạng thái đã nhận khi điều hướng.
- 26 test Workers/D1, bootstrap check, typecheck, build, staging dry-run và dependency audit đạt. Browser kiểm tra sparse variant, quote-confirm, gate off, song ngữ/mobile và unknown status bằng dữ liệu tổng hợp.
- Không credential thật/đơn thật/deploy/DNS; live gates còn đóng. `ak` CLI chưa cài nên ghi file trực tiếp; AgentWiki publish skipped.
