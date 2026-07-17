import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // pencere odağı değiştiğinde otomatik yenilemeyi kapat
      retry: 1, // hata durumunda 1 kez tekrar dene
      staleTime: 5 * 60 * 1000, // veriyi 5 dakika boyunca taze kabul et
      cacheTime: 10 * 60 * 1000, // önbellekte 10 dakika boyunca tut
    },
    mutations: {
      retry: 0 // veri gönderme işlemlerinde otomatik tekrar denemeyi kapat
    }
  }
});
