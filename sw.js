// Service worker ของแอปจองห้องประชุม Zoom
// เก็บไฟล์ของหน้าแอป (ไอคอน หน้าโหลด) ไว้ในเครื่อง เพื่อให้เปิดเร็วและติดตั้งเป็นแอปได้
// ข้อมูลการจองโหลดจากระบบจริงทุกครั้ง (ไม่เก็บในเครื่อง)
const CACHE = 'zb-shell-v4';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // ระบบจองและไฟล์ภายนอก: ไม่แตะ
  if (url.pathname.includes('/manuals/')) return; // ไฟล์คู่มือ PDF: โหลดจากเน็ตตรง ไม่เก็บแทนหน้าแอป

  if (req.mode === 'navigate') {
    // หน้าแอป: ใช้ของใหม่จากเน็ตก่อน ถ้าไม่มีเน็ตใช้ที่เก็บไว้
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ไอคอนและไฟล์อื่นของแอป: ใช้ที่เก็บไว้ก่อน
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
