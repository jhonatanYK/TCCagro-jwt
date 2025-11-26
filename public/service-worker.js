const CACHE_NAME = 'gestor-agro-v3'; // Versão atualizada - força reload
const urlsToCache = [
  '/',
  '/styles.css',
  '/tailwind.css',
  '/trator.png'
  // Removido '/dashboard' do cache para sempre pegar versão atualizada
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta requisições
self.addEventListener('fetch', event => {
  // Não fazer cache de requisições POST
  if (event.request.method === 'POST') {
    return event.respondWith(fetch(event.request));
  }
  
  // Não fazer cache da dashboard - sempre buscar versão mais recente
  if (event.request.url.includes('/dashboard')) {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache se disponível, senão busca na rede
        return response || fetch(event.request);
      })
      .catch(() => {
        // Se falhar, retorna a página de índice como fallback
        return caches.match('/');
      })
  );
});
