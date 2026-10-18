/* A short editorial homepage. The complete catalog remains on #/shop. */
(() => {
  const copy = {
    vi: {
      over: 'TUYỂN CHỌN BỞI ALMIRA', line1: 'Thanh lịch', line2: 'theo cách', line3: 'của bạn.',
      intro: 'Những thiết kế được chọn kỹ, dành cho phong cách riêng của bạn.',
      shop: 'Khám phá thiết kế', about: 'Về Almira', caption: 'Chọn kỹ. Dành riêng.',
      editOver: 'THE CONSIDERED EDIT', editTitle: 'Tuyển chọn của Almira', all: 'Xem toàn bộ thiết kế',
      discover: 'Khám phá thêm', brands: 'Thương hiệu', cats: 'Danh mục', how: 'Cách đặt order'
    },
    en: {
      over: 'THOUGHTFULLY CHOSEN BY ALMIRA', line1: 'Elegance', line2: 'in your', line3: 'own way.',
      intro: 'Considered pieces, chosen for your own sense of style.',
      shop: 'Explore the collection', about: 'About Almira', caption: 'Chosen with intention.',
      editOver: 'THE CONSIDERED EDIT', editTitle: 'The Almira selection', all: 'View the full collection',
      discover: 'Discover more', brands: 'Brands', cats: 'Categories', how: 'How to order'
    }
  };
  const selections = [
    { id: '1b82ebb8-58c5-408e-8007-ce09ba64c4aa', cat: 'dam', image: 'assets/editorial/category-dam.webp' },
    { id: 'ce5482d1-3f7f-4252-9d30-1646a09ac565', cat: 'ao', image: 'assets/editorial/category-ao.webp' },
    { id: 'f9366c81-c025-4f93-a3a9-9a0c59c21569', cat: 'set', image: 'assets/editorial/category-set.webp' },
    { id: 'c07af82f-fb80-49d6-8832-5ad125da56f1', cat: 'khoac', image: 'assets/editorial/category-khoac.webp' }
  ];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const text = copy[lang === 'en' ? 'en' : 'vi'];
    document.querySelectorAll('[data-home]').forEach(el => { el.textContent = text[el.dataset.home] || ''; });
    const grid = document.getElementById('homePicks');
    if (!grid) return;
    const used = new Set();
    grid.innerHTML = selections.map((pick, i) => {
      const product = byId(pick.id) || PRODUCTS.find(p => p.cat === pick.cat && !used.has(p.id));
      if (!product) return '';
      used.add(product.id);
      const image = product.id === pick.id ? pick.image : product.img;
      return `<a class="home-pick" href="#/product/${encodeURIComponent(product.id)}" title="${esc(pName(product))}" style="--pick-delay:${i * 70}ms"><span class="home-pick-image"><img src="${esc(image)}" alt="${esc(pName(product))}" loading="lazy" decoding="async" width="600" height="800"><span class="home-pick-arrow" aria-hidden="true">↗</span></span><span class="home-pick-brand">${esc(product.brand)}</span><h3>${esc(pName(product))}</h3><span class="home-pick-price">${esc(fmt(product.price))}</span></a>`;
    }).join('');
    // Optional motion enhancement: visible content is always the baseline.
    if (grid._homeObserver) grid._homeObserver.disconnect();
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('home-pick-enter'); observer.unobserve(entry.target); }
      }), {threshold:.08});
      grid.querySelectorAll('.home-pick').forEach(el => observer.observe(el));
      grid._homeObserver = observer;
    }
  }
  window.AlmiraHome = {render};
  render();
})();
