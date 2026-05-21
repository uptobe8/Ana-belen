const CACHE_NAME = 'memoria-familiar-v7-music-2026';
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./fix-memory.js",
  "./background-music.js",
  "./data/personas.js",
  "./assets/icon.svg",
  "./manifest.webmanifest",
  "./assets/personas/persona_01.jpg",
  "./assets/personas/persona_02.jpg",
  "./assets/personas/persona_03.jpg",
  "./assets/personas/persona_04.jpg",
  "./assets/personas/persona_05.jpg",
  "./assets/personas/persona_06.jpg",
  "./assets/personas/persona_07.jpg",
  "./assets/personas/persona_08.jpg",
  "./assets/audio/guia/done_well.mp3",
  "./assets/audio/guia/finished.mp3",
  "./assets/audio/guia/intro.mp3",
  "./assets/audio/guia/listen_voice.mp3",
  "./assets/audio/guia/look_calm.mp3",
  "./assets/audio/guia/no_problem.mp3",
  "./assets/audio/guia/perfect.mp3",
  "./assets/audio/guia/press_listen_again.mp3",
  "./assets/audio/guia/press_repeat.mp3",
  "./assets/audio/guia/remember_moment.mp3",
  "./assets/audio/guia/remember_person.mp3",
  "./assets/audio/guia/rest.mp3",
  "./assets/audio/guia/same_photo.mp3",
  "./assets/audio/guia/slow.mp3",
  "./assets/audio/guia/step_by_step.mp3",
  "./assets/audio/guia/tap_its_photo.mp3",
  "./assets/audio/guia/tap_name_correct.mp3",
  "./assets/audio/guia/tap_option.mp3",
  "./assets/audio/guia/tap_photo_correct.mp3",
  "./assets/audio/guia/tap_same_photo.mp3",
  "./assets/audio/guia/thanks.mp3",
  "./assets/audio/guia/thats_it.mp3",
  "./assets/audio/guia/try_again.mp3",
  "./assets/audio/guia/very_good.mp3",
  "./assets/audio/guia/where_photo.mp3",
  "./assets/audio/guia/who_in_photo.mp3",
  "./assets/audio/guia/who_person.mp3"
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match('./index.html'))));
});
