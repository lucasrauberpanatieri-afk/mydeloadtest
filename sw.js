const CACHE_NAME = 'mydeload-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
  // Adicione outros recursos locais se houver
];

// Instalação: cache dos assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Estratégia de fetch: Cache First com atualização em segundo plano
// Isso garante que, mesmo offline, os recursos (incluindo o CDN do Tailwind) funcionem após o primeiro carregamento online.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Sempre tenta buscar da rede para atualizar o cache
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Verifica se a resposta é válida
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se a rede falhar, retorna o cache (se existir)
        return cachedResponse;
      });

      // Retorna o cache imediatamente se existir, senão espera a rede
      return cachedResponse || fetchPromise;
    })
  );
});
