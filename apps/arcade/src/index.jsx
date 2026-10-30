document.querySelector('#loading-portfolio').href = import.meta.env.VITE_IFRAME_URL || '/portfolio/';

// WebKit can offset transformed Html at odd or fractional canvas sizes (drei#720).
const root = document.querySelector('#root');
const viewportObserver = new ResizeObserver(([entry]) => {
  root.style.width = `${Math.ceil(entry.contentRect.width / 2) * 2}px`;
  root.style.height = `${Math.ceil(entry.contentRect.height / 2) * 2}px`;
});
viewportObserver.observe(document.documentElement);

import('./scene.jsx');
