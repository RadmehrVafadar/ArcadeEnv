const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

if (mobile) {
  window.location.replace(import.meta.env.VITE_IFRAME_URL || '/portfolio/');
} else {
  document.querySelector('#loading-portfolio').href = import.meta.env.VITE_IFRAME_URL || '/portfolio/';
  import('./scene.jsx');
}
