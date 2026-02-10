const CACHE_NAME = 'cnpjpublic-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/style.css',
  '/script.js',
  '/auth.js',
  '/dashboard.js',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aberto');
        return cache.addAll(urlsToCache).catch(() => {
          // Continuar mesmo se alguns arquivos falharem
          return Promise.resolve();
        });
      })
      .catch(err => console.error('❌ Erro ao cachear:', err))
  );
  // Não usar skipWaiting para evitar reativações
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Só fazer claim após primeiro registro
  return self.clients.claim();
});

// Estratégia: Network First para API, Cache First para assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Para requisições à API - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cachear resposta bem-sucedida
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar cache
          return caches.match(request);
        })
    );
  } else {
    // Para assets estáticos - Cache First
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Se estiver em cache, retornar
          if (response) {
            return response;
          }

          return fetch(request).then(response => {
            // Validar resposta
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });

            return response;
          });
        })
        .catch(() => {
          // Fallback se offline e não houver cache
          return new Response('Offline - conteúdo não disponível', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        })
    );
  }
});
