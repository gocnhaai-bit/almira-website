/* Dedicated document views; move sections instead of duplicating IDs or listeners. */
(() => {
  const names = ['shop', 'cats', 'how', 'about', 'contact', 'policy'];
  const sections = new Map();
  names.forEach(name => {
    const element = document.getElementById(name);
    const marker = document.createComment('home-section-' + name);
    element.before(marker);
    sections.set(name, {element, marker});
  });
  const shell = document.createElement('div');
  shell.id = 'sectionView'; shell.className = 'view';
  shell.innerHTML = '<div class="wrap"><nav class="crumb" aria-label="Breadcrumb"><a href="#/home" id="sectionHome">Trang chủ</a><span class="sep">/</span><span class="here" id="sectionCrumb"></span></nav><div id="sectionContent"></div></div>';
  document.querySelector('main').after(shell);
  const restore = () => sections.forEach(({element, marker}) => marker.after(element));
  window.AlmiraPages = {
    handle(name) {
      restore();
      if (!sections.has(name)) return false;
      showRoute('section');
      const {element} = sections.get(name);
      document.getElementById('sectionContent').append(element);
      element.querySelectorAll('.reveal,.m-reveal,.split,.sec-head,.filters').forEach(el => el.classList.add('in'));
      const title = element.querySelector('h2')?.textContent || name;
      document.getElementById('sectionCrumb').textContent = title;
      document.getElementById('sectionHome').textContent = lang === 'en' ? 'Home' : 'Trang chủ';
      document.title = title + ' — Almira Studio';
      return true;
    },
    refresh() {
      if (document.body.dataset.page === 'section') {
        const title = document.querySelector('#sectionContent h2')?.textContent || '';
        document.getElementById('sectionCrumb').textContent = title;
        document.getElementById('sectionHome').textContent = lang === 'en' ? 'Home' : 'Trang chủ';
        document.title = title + ' — Almira Studio';
      }
    }
  };
  // Existing hero/footer calls use the same pages as the menu.
  document.querySelectorAll('a[href]').forEach(a => {
    const target = a.getAttribute('href');
    if (names.some(name => target === '#' + name)) a.setAttribute('href', '#/' + target.slice(1));
    if (target === '#top') a.setAttribute('href', '#/home');
  });
  route();
})();
