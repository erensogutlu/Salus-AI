import { BrowserRouter as Yonlendirici, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { YetkilendirmeSaglayici, useYetkilendirme } from './baglam/YetkilendirmeBaglami';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './servisler/queryClient';

// bileşenler
import Baslik from './bilesenler/Baslik';
import AltBilgi from './bilesenler/AltBilgi';
import YuklemeSpinner from './bilesenler/YuklemeSpinner';
import SayfaBasiKaydir from './bilesenler/SayfaBasiKaydir';

// sayfalar
import AnaSayfa from './sayfalar/AnaSayfa';
import GirisYap from './sayfalar/GirisYap';
import KayitOl from './sayfalar/KayitOl';
import Panel from './sayfalar/Panel';
import AiSohbet from './sayfalar/AiSohbet';
import Profil from './sayfalar/Profil';
import Ayarlar from './sayfalar/Ayarlar';
import Raporlar from './sayfalar/Raporlar';
import YoneticiPaneli from './sayfalar/YoneticiPaneli';

// siber araç sayfaları
import TehditAnaliz from './sayfalar/araclar/TehditAnaliz';
import AgTarama from './sayfalar/araclar/AgTarama';
import LogAnaliz from './sayfalar/araclar/LogAnaliz';
import SifreAraclari from './sayfalar/araclar/SifreAraclari';
import HashBase64 from './sayfalar/araclar/HashBase64';
import IpSorgu from './sayfalar/araclar/IpSorgu';
import SubdomainBulucu from './sayfalar/araclar/SubdomainBulucu';
import HeaderAnalizi from './sayfalar/araclar/HeaderAnalizi';

import Hakkimizda from './sayfalar/Hakkimizda';
import Blog from './sayfalar/Blog';
import Kariyer from './sayfalar/Kariyer';
import Iletisim from './sayfalar/Iletisim';
import Dokumantasyon from './sayfalar/Dokumantasyon';
import SSS from './sayfalar/SSS';
import Gizlilik from './sayfalar/Gizlilik';
import Sartlar from './sayfalar/Sartlar';
import Cerezler from './sayfalar/Cerezler';

import './App.css';

// korumalı rotalar için ara katman bileşeni
const KorumaliRota = () => {
  const { oturumAcikMi, yukleniyor } = useYetkilendirme();

  // yükleniyorsa spinner göster
  if (yukleniyor) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <YuklemeSpinner />
      </div>
    );
  }

  // oturum açıksa içeriği, değilse girişe yönlendir
  return oturumAcikMi ? <Outlet /> : <Navigate to="/giris" replace />;
};

// giriş yapmış kullanıcının tekrar giriş/kayıt sayfalarına gitmesini engeller
const MisafirRotasi = () => {
  const { oturumAcikMi, yukleniyor } = useYetkilendirme();

  if (yukleniyor) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <YuklemeSpinner />
      </div>
    );
  }

  return !oturumAcikMi ? <Outlet /> : <Navigate to="/panel" replace />;
};

const YoneticiRotasi = () => {
  const { kullanici, oturumAcikMi, yukleniyor } = useYetkilendirme();

  if (yukleniyor) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <YuklemeSpinner />
      </div>
    );
  }

  return oturumAcikMi && kullanici?.rol === 'admin' ? <Outlet /> : <Navigate to="/panel" replace />;
};

function UygulamaIcerik() {
  // başlangıçta temayı yükle
  useEffect(() => {
    const kayitliTema = localStorage.getItem('salus-tema') || 'koyu';
    document.documentElement.setAttribute('data-theme', kayitliTema);
  }, []);

  return (
    <div className="uygulama-konteyner">
      <Baslik />
      <main className="ana-icerik">
        <Routes>
          <Route path="/" element={<AnaSayfa />} />
          
          {/* genel altbilgi rotaları */}
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/kariyer" element={<Kariyer />} />
          <Route path="/iletisim" element={<Iletisim />} />
          <Route path="/dokumantasyon" element={<Dokumantasyon />} />
          <Route path="/sss" element={<SSS />} />
          <Route path="/gizlilik" element={<Gizlilik />} />
          <Route path="/sartlar" element={<Sartlar />} />
          <Route path="/cerezler" element={<Cerezler />} />

          {/* misafir rotaları (oturum açmamış olmalı) */}
          <Route element={<MisafirRotasi />}>
            <Route path="/giris" element={<GirisYap />} />
            <Route path="/kayit" element={<KayitOl />} />
          </Route>

          {/* korumalı rotalar (oturum açmış olmalı) */}
          <Route element={<KorumaliRota />}>
            <Route path="/panel" element={<Panel />} />
            <Route path="/ai-sohbet" element={<AiSohbet />} />
            <Route path="/tehdit-analiz" element={<TehditAnaliz />} />
            <Route path="/ag-tarama" element={<AgTarama />} />
            <Route path="/log-analiz" element={<LogAnaliz />} />
            <Route path="/raporlar" element={<Raporlar />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/ayarlar" element={<Ayarlar />} />
            
            {/* siber araç rotaları */}
            <Route path="/araclar/sifre" element={<SifreAraclari />} />
            <Route path="/araclar/kripto" element={<HashBase64 />} />
            <Route path="/araclar/ip-sorgu" element={<IpSorgu />} />
            <Route path="/araclar/subdomain" element={<SubdomainBulucu />} />
            <Route path="/araclar/header" element={<HeaderAnalizi />} />
          </Route>

          {/* yönetici rotaları */}
          <Route element={<YoneticiRotasi />}>
            <Route path="/yonetim" element={<YoneticiPaneli />} />
          </Route>

          {/* tanımlanmayan rotalar için yönlendirme */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AltBilgi />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YetkilendirmeSaglayici>
        <Yonlendirici>
          <SayfaBasiKaydir />
          <UygulamaIcerik />
        </Yonlendirici>
      </YetkilendirmeSaglayici>
    </QueryClientProvider>
  );
}

export default App;
