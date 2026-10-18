/* Almira order guide: self-contained content renderer; no order or payment API calls. */
(function () {
  "use strict";
  const content = {
    vi: {
      kicker: "THE ALMIRA WAY · ĐẶT RIÊNG CHO BẠN",
      title: "Cách đặt order",
      lead: "Từ một lựa chọn yêu thích, đến món đồ dành riêng cho bạn.",
      intro: "Một quy trình rõ ràng, một chút chờ đợi có chủ đích. Almira đồng hành cùng bạn từ chọn mẫu, tư vấn size đến khi nhận hàng.",
      browse: "Khám phá sản phẩm", contact: "Trao đổi với Almira", arrow: "Khám phá",
      visualLabel: "CHỌN KỸ · ĐẶT RIÊNG · CHĂM CHÚT",
      visualCaption: "Những lựa chọn đáng để chờ.",
      depositTitle: "Cọc trước", depositLabel: "tổng đơn sau ưu đãi", depositNote: "Shop xác nhận số tiền trước khi bạn chuyển khoản.",
      estimateValue: "7–14 ngày", estimateLabel: "Thời gian về hàng ước tính",
      journeyKicker: "MỘT HÀNH TRÌNH, BỐN BƯỚC",
      journeyTitle: "Rõ ràng từ lần chọn đầu tiên.",
      journeyIntro: "Bạn chọn điều mình yêu thích. Những chi tiết còn lại, mình cùng xác nhận thật kỹ.",
      steps: [
        { label: "LỰA CHỌN", title: "Tìm mẫu dành cho bạn", body: "Khám phá sản phẩm, chọn đúng màu và size rồi thêm vào giỏ. Nếu còn phân vân, gửi shop mã mẫu hoặc ảnh sản phẩm để được tư vấn.", foot: "Mẫu · Màu · Size · Số lượng" },
        { label: "XÁC NHẬN", title: "Chốt thông tin & tiền cọc", body: "Điền thông tin ở checkout, sau đó liên hệ Almira. Shop kiểm tra tình trạng hàng, giảm giá và tổng đơn; bạn chỉ cọc sau khi nhận được xác nhận.", foot: "Cọc 50% tổng đơn sau ưu đãi" },
        { label: "ĐẶT MUA", title: "Chờ món đồ được đặt riêng", body: "Sau khi shop xác nhận đơn và tiền cọc, Almira tiến hành đặt mua. Thời gian về hàng thường ước tính 7–14 ngày và có thể thay đổi theo hãng hoặc vận chuyển.", foot: "Ước tính, không phải cam kết giao hàng" },
        { label: "NHẬN HÀNG", title: "Hoàn tất đơn cùng Almira", body: "Khi hàng về, shop trao đổi lịch giao và số tiền còn lại. Bạn nhận, kiểm tra hàng và hoàn tất thanh toán theo thông tin đã thống nhất với shop.", foot: "Địa chỉ · Lịch giao · Số tiền còn lại" }
      ],
      prepareKicker: "TRƯỚC KHI BẮT ĐẦU", prepareTitle: "Một vài chi tiết nhỏ, cho đơn hàng thật vừa ý.",
      checklist: ["Mã mẫu hoặc liên kết sản phẩm yêu thích", "Màu, size và số lượng muốn đặt", "Chiều cao, cân nặng hoặc số đo nếu cần tư vấn size", "Tên, số điện thoại và địa chỉ người nhận"],
      paymentKicker: "THANH TOÁN & XÁC NHẬN", paymentTitle: "Xác nhận trước. Chuyển khoản sau.",
      paymentCopy: "Tiền cọc bằng 50% tổng đơn hàng sau khi áp dụng giảm giá/chiết khấu (nếu có). Tổng đơn, các khoản phí nếu có và số tiền cần cọc được Almira xác nhận trước khi thanh toán.",
      truthful: "Checkout trên website hiện là bước chuẩn bị thông tin và chọn phương thức thanh toán — chưa tự gửi đơn đến shop, chưa xác nhận đặt hàng hoặc xác minh giao dịch. Vui lòng liên hệ Almira để chốt đơn và kiểm tra thông tin nhận tiền trước khi chuyển.",
      methods: "MB Bank / PayPal · theo hướng dẫn được shop xác nhận", contactShort: "Liên hệ để xác nhận đơn",
      faqKicker: "NHỮNG ĐIỀU BẠN CÓ THỂ MUỐN BIẾT", faqTitle: "Hỏi một chút, an tâm hơn.",
      faqs: [
        ["Cọc 50% được tính như thế nào?", "Tiền cọc được tính bằng 50% tổng đơn hàng sau khi áp dụng giảm giá/chiết khấu (nếu có). Shop sẽ xác nhận tổng tiền, các khoản phí nếu có và số tiền cọc cụ thể trước khi bạn thanh toán."],
        ["7–14 ngày có phải ngày giao hàng cố định?", "Không. Đây là thời gian về hàng ước tính, có thể thay đổi tùy tình trạng hàng của hãng, lịch đặt mua và vận chuyển. Hãy trao đổi với shop nếu bạn cần sản phẩm cho một dịp cụ thể."],
        ["Điền checkout xong là đã đặt hàng thành công chưa?", "Chưa. Website hiện chưa tự gửi đơn hoặc xác minh thanh toán. Bạn cần liên hệ Almira để shop kiểm tra hàng và xác nhận đơn trước khi chuyển tiền."],
        ["Nếu chưa biết chọn size hoặc cần đổi thông tin?", "Gửi shop mẫu bạn chọn cùng chiều cao, cân nặng hoặc số đo để được tư vấn. Nếu muốn đổi màu, size hay thông tin giao hàng, hãy liên hệ sớm để Almira kiểm tra khả năng điều chỉnh theo tình trạng đơn."]
      ],
      closingKicker: "YOUR NEXT FAVOURITE, THOUGHTFULLY CHOSEN.", closingTitle: "Bắt đầu từ món đồ bạn yêu thích.", closingText: "Dạo một vòng cửa hàng, hoặc để Almira cùng bạn tìm lựa chọn phù hợp."
    },
    en: {
      kicker: "THE ALMIRA WAY · CHOSEN FOR YOU",
      title: "How to order",
      lead: "From a favourite find to a piece chosen just for you.",
      intro: "A clear process, and a little thoughtful anticipation. Almira helps with your selection, sizing and every detail along the way.",
      browse: "Explore the collection", contact: "Talk to Almira", arrow: "Explore",
      visualLabel: "THOUGHTFULLY CHOSEN · PERSONALLY ORDERED",
      visualCaption: "Good things are worth the wait.",
      depositTitle: "Deposit", depositLabel: "of the order total after discounts", depositNote: "The shop confirms the amount before you transfer.",
      estimateValue: "7–14 days", estimateLabel: "Estimated arrival time",
      journeyKicker: "ONE JOURNEY, FOUR STEPS", journeyTitle: "Considered from the very first choice.",
      journeyIntro: "Choose what you love. We will confirm the finer details together.",
      steps: [
        { label: "CHOOSE", title: "Find your favourite", body: "Explore the collection, select a colour and size, then add your choice to the bag. If you are unsure, send the shop a product link or photo for advice.", foot: "Style · Colour · Size · Quantity" },
        { label: "CONFIRM", title: "Agree the details & deposit", body: "Enter your details at checkout, then contact Almira. The shop confirms availability, discounts and the order total. Pay your deposit only after that confirmation.", foot: "50% of the order total after discounts" },
        { label: "ORDER", title: "Let your selection make its way", body: "Once the shop confirms the order and deposit, Almira places the purchase. Arrival is usually estimated at 7–14 days and may vary with the brand or shipping.", foot: "An estimate, not a delivery guarantee" },
        { label: "RECEIVE", title: "Complete your order together", body: "When your items arrive, the shop confirms delivery arrangements and the remaining balance. Receive and check your items, then complete payment as agreed with Almira.", foot: "Address · Delivery arrangements · Balance" }
      ],
      prepareKicker: "BEFORE YOU BEGIN", prepareTitle: "A few small details for a better fit.",
      checklist: ["A product link or style reference", "Your preferred colour, size and quantity", "Height, weight or measurements if you need sizing advice", "Recipient’s name, phone number and delivery address"],
      paymentKicker: "PAYMENT & CONFIRMATION", paymentTitle: "Confirm first. Transfer afterwards.",
      paymentCopy: "Your deposit is 50% of the total order amount after discounts. Almira confirms the total, any applicable charges and your deposit amount before payment.",
      truthful: "Website checkout currently prepares your details and payment-method choice. It does not automatically send an order to the shop, confirm an order or verify a payment. Contact Almira to confirm the order and receiving-account details before transferring.",
      methods: "MB Bank / PayPal · as confirmed by the shop", contactShort: "Confirm with Almira",
      faqKicker: "A LITTLE CLARITY", faqTitle: "Good questions. Thoughtful answers.",
      faqs: [
        ["How is the 50% deposit calculated?", "The deposit is 50% of the total order amount after discounts. The shop confirms your total, any applicable charges and the exact deposit amount before you pay."],
        ["Is 7–14 days a guaranteed delivery date?", "No. It is an estimated arrival window, which may vary depending on brand availability, purchasing schedules and shipping. Please tell the shop if you need an item for a particular occasion."],
        ["Does completing checkout confirm my order?", "Not yet. The website does not automatically send orders or verify payments. Contact Almira so the shop can check availability and confirm your order before you transfer money."],
        ["What if I need size advice or want to change my details?", "Send the shop your chosen style and your height, weight or measurements for advice. If you need to change a colour, size or delivery detail, contact Almira early so the shop can check what is possible at your order’s current stage."]
      ],
      closingKicker: "YOUR NEXT FAVOURITE, THOUGHTFULLY CHOSEN.", closingTitle: "Begin with something you love.", closingText: "Take a look around the collection, or let Almira help you find your next favourite."
    }
  };
  const escape = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  const check = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 10 3.1 3.1L15 6.5"/></svg>';
  function render(sectionElement) {
    if (!sectionElement || !(sectionElement instanceof Element)) return;
    const t = content[typeof lang !== "undefined" && lang === "en" ? "en" : "vi"];
    sectionElement.classList.add("og-guide");
    // An optimized local copy selected from the actual Almira product catalog.
    const photo = { img: "assets/editorial/category-dam.webp" };
    sectionElement.innerHTML = `
      <div class="og-hero og-reveal">
        <div class="og-hero-copy">
          <span class="og-eyebrow">${t.kicker}</span>
          <h2>${t.title}</h2>
          <p class="og-lead">${t.lead}</p>
          <p class="og-intro">${t.intro}</p>
          <div class="og-actions"><a class="og-button og-button-primary" href="#/shop">${t.browse}${arrow}</a><a class="og-text-link" href="#/contact">${t.contact}${arrow}</a></div>
          <div class="og-estimate"><span class="og-estimate-dot" aria-hidden="true"></span><div><strong>${t.estimateValue}</strong><span>${t.estimateLabel}</span></div></div>
        </div>
        <div class="og-visual" aria-hidden="true">
          <div class="og-visual-orbit"></div>
          <div class="og-editorial-photo">${photo ? `<img src="${escape(photo.img)}" alt="" loading="lazy" decoding="async">` : '<span class="og-photo-fallback">ALMIRA<br>STUDIO</span>'}<span class="og-photo-caption">${t.visualLabel}</span></div>
          <div class="og-deposit-card"><span class="og-eyebrow">${t.depositTitle}</span><strong>50<span>%</span></strong><p>${t.depositLabel}</p><small>${t.depositNote}</small><span class="og-card-spark">✦</span></div>
          <p class="og-visual-caption">${t.visualCaption}</p>
        </div>
      </div>
      <div class="og-journey">
        <div class="og-section-heading og-reveal"><span class="og-eyebrow">${t.journeyKicker}</span><h3>${t.journeyTitle}</h3><p>${t.journeyIntro}</p></div>
        <ol class="og-timeline">${t.steps.map((step, i) => `<li class="og-timeline-item og-reveal" style="--og-delay:${i * 65}ms"><div class="og-marker"><span>${String(i + 1).padStart(2, "0")}</span><b>${step.label}</b></div><div class="og-step-card"><h4>${step.title}</h4><p>${step.body}</p><span class="og-step-foot">${step.foot}</span></div></li>`).join("")}</ol>
      </div>
      <div class="og-information">
        <div class="og-preparation og-panel og-reveal"><span class="og-eyebrow">${t.prepareKicker}</span><h3>${t.prepareTitle}</h3><ul class="og-checklist">${t.checklist.map(item => `<li><span class="og-check">${check}</span><span>${item}</span></li>`).join("")}</ul></div>
        <div class="og-payment og-panel og-reveal" style="--og-delay:80ms"><span class="og-eyebrow">${t.paymentKicker}</span><h3>${t.paymentTitle}</h3><p>${t.paymentCopy}</p><div class="og-honest-note"><span class="og-note-icon" aria-hidden="true">i</span><p>${t.truthful}</p></div><span class="og-methods">${t.methods}</span><a class="og-text-link" href="#/contact">${t.contactShort}${arrow}</a></div>
      </div>
      <div class="og-faq-section og-reveal"><div class="og-section-heading"><span class="og-eyebrow">${t.faqKicker}</span><h3>${t.faqTitle}</h3></div><div class="og-faq-list">${t.faqs.map(([question, answer]) => `<details class="og-faq"><summary>${question}<span class="og-faq-icon" aria-hidden="true"></span></summary><div class="og-faq-answer"><p>${answer}</p></div></details>`).join("")}</div></div>
      <div class="og-closing og-reveal"><div><span class="og-eyebrow">${t.closingKicker}</span><h3>${t.closingTitle}</h3><p>${t.closingText}</p></div><a class="og-button og-button-primary" href="#/shop">${t.browse}${arrow}</a></div>`;
    sectionElement.querySelectorAll(".og-editorial-photo img").forEach(img => img.addEventListener("error", () => img.remove(), { once: true }));
    // Content is always visible. IntersectionObserver only triggers optional entrance motion.
    // No opacity:0 baseline: moving this section between home and its route cannot hide it.
    const oldObserver = sectionElement._almiraOrderObserver;
    if (oldObserver) oldObserver.disconnect();
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("og-enter"); observer.unobserve(entry.target); }
      }), { threshold: 0.06 });
      sectionElement.querySelectorAll(".og-reveal").forEach(el => observer.observe(el));
      sectionElement._almiraOrderObserver = observer;
    }
  }
  window.AlmiraOrderGuide = { render };
})();
