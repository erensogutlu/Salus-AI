const API_TEMEL_URL = '/api';

// genel api istek fonksiyonu
export const apiIstegi = async (yol, secenekler = {}) => {
  const jeton = localStorage.getItem('salus_jeton');

  const basliklar = {
    'Content-Type': 'application/json',
    ...secenekler.headers,
  };

  if (jeton) {
    basliklar['Authorization'] = `Bearer ${jeton}`;
  }

  try {
    const yanit = await fetch(`${API_TEMEL_URL}${yol}`, {
      ...secenekler,
      headers: basliklar,
    });

    const veri = await yanit.json();

    if (!yanit.ok) {
      throw new Error(veri.mesaj || veri.message || 'Bir hata oluştu');
    }

    return veri;
  } catch (hata) {
    if (hata.name === 'TypeError' && hata.message === 'Failed to fetch') {
      throw new Error('Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.');
    }
    throw hata;
  }
};

// ===== kimlik doğrulama servisleri =====
export const girisYap = (eposta, sifre) => {
  return apiIstegi('/yetkilendirme/giris', {
    method: 'POST',
    body: JSON.stringify({ eposta, sifre }),
  });
};

export const kayitOl = (kullanici_adi, eposta, sifre, tam_ad) => {
  return apiIstegi('/yetkilendirme/kayit', {
    method: 'POST',
    body: JSON.stringify({ kullanici_adi, eposta, sifre, tam_ad }),
  });
};

// ===== profil servisleri =====
export const profilGetir = () => {
  return apiIstegi('/yetkilendirme/profil');
};

export const profilGuncelle = (veri) => {
  return apiIstegi('/kullanici/profil', {
    method: 'PUT',
    body: JSON.stringify(veri),
  });
};

export const sifreDegistir = (mevcutSifre, yeniSifre) => {
  return apiIstegi('/kullanici/sifre', {
    method: 'PUT',
    body: JSON.stringify({ mevcutSifre, yeniSifre }),
  });
};

// ===== ai sohbet servisleri =====
export const aiMesajGonder = (mesaj, oturumId = null) => {
  return apiIstegi('/ai/mesaj', {
    method: 'POST',
    body: JSON.stringify({ mesaj, oturumId }),
  });
};

export const aiGecmisGetir = () => {
  return apiIstegi('/ai/gecmis');
};

export const sohbetSil = (id) => {
  return apiIstegi(`/ai/sohbet/${id}`, {
    method: 'DELETE',
  });
};

// ===== tehdit analiz servisleri =====
export const tehditAnaliz = (hedef) => {
  return apiIstegi('/tehdit/analiz', {
    method: 'POST',
    body: JSON.stringify({ hedef }),
  });
};

export const logAnaliziYap = (logMetni) => {
  return apiIstegi('/tehdit/log-analiz', {
    method: 'POST',
    body: JSON.stringify({ logMetni }),
  });
};

export const tehditKayitlari = () => {
  return apiIstegi('/tehdit/kayitlar');
};

export const tehditKayitSil = (id) => {
  return apiIstegi(`/tehdit/kayitlar/${id}`, {
    method: 'DELETE',
  });
};

export const tehditIstatistik = () => {
  return apiIstegi('/tehdit/istatistik');
};

// ===== panel servisleri =====
export const panelVerisi = () => {
  return apiIstegi('/kullanici/panel');
};

// ===== ağ tarama servisleri =====
export const agTaramaBaslat = (hedef) => {
  return apiIstegi('/tehdit/analiz', {
    method: 'POST',
    body: JSON.stringify({ hedef }),
  });
};

export const taramaSonuclari = () => {
  return apiIstegi('/tehdit/taramalar');
};

export const hesapSil = () => {
  return apiIstegi('/kullanici/sil', {
    method: 'DELETE',
  });
};

// ===== siber araçlar servisleri =====
export const aracCagir = (aracTipi, veri) => {
  return apiIstegi('/araclar/calistir', {
    method: 'POST',
    body: JSON.stringify({ aracTipi, veri }),
  });
};

// ===== yönetici servisleri =====
export const yonetimKullanicilariListele = () => {
  return apiIstegi('/yonetim/kullanicilar');
};

export const yonetimKullaniciGuncelle = (id, veri) => {
  return apiIstegi(`/yonetim/kullanicilar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(veri),
  });
};

export const yonetimKullaniciSil = (id) => {
  return apiIstegi(`/yonetim/kullanicilar/${id}`, {
    method: 'DELETE',
  });
};

export const yonetimSistemSagligi = () => {
  return apiIstegi('/yonetim/saglik');
};

