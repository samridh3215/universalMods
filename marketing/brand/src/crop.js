// Fills every .crop[data-src][data-box] with a scaled region of a 1600x1000 app screenshot.
// Also injects the logo mark into every .mark element, so the name/logo live in one place.
const APP_W = 1600;
const MARK = `<svg class="mark" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="8" height="8" rx="2" fill="#ececea"/>
  <rect x="14" y="2" width="8" height="8" rx="2" fill="#ececea"/>
  <rect x="2" y="14" width="8" height="8" rx="2" fill="#ececea"/>
  <rect x="14" y="14" width="8" height="8" rx="2" fill="#6b9bff"/></svg>`;

document.querySelectorAll('.mark').forEach((el) => (el.outerHTML = MARK));

document.querySelectorAll('.crop[data-src]').forEach((el) => {
  const [x, y, w, h] = el.dataset.box.split(',').map(Number);
  const img = new Image();
  img.onload = () => {
    const dpr = img.naturalWidth / APP_W; // source px per app CSS px
    const s = el.clientWidth / w; // output px per app CSS px
    if (!el.style.height) el.style.height = `${h * s}px`;
    img.style.width = `${(img.naturalWidth / dpr) * s}px`;
    img.style.left = `${-x * s}px`;
    img.style.top = `${-y * s}px`;
    el.appendChild(img);
  };
  img.src = el.dataset.src;
});
