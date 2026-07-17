import { createContext, useContext, useState, useEffect } from 'react';
import { profilGetir } from '../servisler/apiServisi';

const YetkilendirmeBaglami = createContext(null);

// bağlam sağlayıcı bileşeni
export const YetkilendirmeSaglayici = ({ children }) => {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [jeton, setJeton] = useState(localStorage.getItem('salus_jeton'));

  // sayfa yüklendiğinde mevcut jetonu kontrol et
  useEffect(() => {
    const kullaniciYukle = async () => {
      if (jeton) {
        try {
          const yanit = await profilGetir();
          setKullanici(yanit.kullanici || yanit);
        } catch (hata) {
          console.error('profil yüklenemedi:', hata);
          cikisYap();
        }
      }
      setYukleniyor(false);
    };

    kullaniciYukle();
  }, []);

  // giriş yap fonksiyonu
  const girisYap = (yeniJeton, kullaniciVerisi) => {
    localStorage.setItem('salus_jeton', yeniJeton);
    setJeton(yeniJeton);
    setKullanici(kullaniciVerisi);
  };

  // kayıt ol fonksiyonu
  const kayitOl = (yeniJeton, kullaniciVerisi) => {
    localStorage.setItem('salus_jeton', yeniJeton);
    setJeton(yeniJeton);
    setKullanici(kullaniciVerisi);
  };

  // çıkış yap fonksiyonu
  const cikisYap = () => {
    localStorage.removeItem('salus_jeton');
    setJeton(null);
    setKullanici(null);
  };

  // oturum açık mı kontrolü
  const oturumAcikMi = !!kullanici && !!jeton;

  const deger = {
    kullanici,
    setKullanici,
    jeton,
    yukleniyor,
    oturumAcikMi,
    girisYap,
    kayitOl,
    cikisYap,
  };

  return (
    <YetkilendirmeBaglami.Provider value={deger}>
      {children}
    </YetkilendirmeBaglami.Provider>
  );
};

// özel kanca - bağlamı kullanmak için
export const useYetkilendirme = () => {
  const baglam = useContext(YetkilendirmeBaglami);
  if (!baglam) {
    throw new Error('useYetkilendirme, YetkilendirmeSaglayici içinde kullanılmalıdır');
  }
  return baglam;
};

export default YetkilendirmeBaglami;
