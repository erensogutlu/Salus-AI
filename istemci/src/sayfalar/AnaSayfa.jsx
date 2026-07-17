import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Brain,
  Wifi,
  Activity,
  FileText,
  ArrowRight,
  Zap,
  Lock,
  Eye,
  Server,
  Bug,
  Radar,
} from 'lucide-react';
import './AnaSayfa.css';

// matrix yağmuru için rastgele karakterler
const matrixKarakterleri = '01アイウエオカキクケコサシスセソ';

const AnaSayfa = () => {
  const [sayaclar, setSayaclar] = useState({ tespit: 0, analiz: 0, koruma: 0, kural: 0 });
  const istatistikRef = useRef(null);
  const sayacBasladi = useRef(false);

  // scroll animasyonları için intersection observer
  useEffect(() => {
    const gozlemci = new IntersectionObserver(
      (girdiler) => {
        girdiler.forEach((girdi) => {
          if (girdi.isIntersecting) {
            girdi.target.classList.add('gorundu');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elemanlar = document.querySelectorAll('.gorunur-animasyon');
    elemanlar.forEach((eleman) => gozlemci.observe(eleman));

    return () => gozlemci.disconnect();
  }, []);

  // sayaç animasyonu
  useEffect(() => {
    const gozlemci = new IntersectionObserver(
      (girdiler) => {
        if (girdiler[0].isIntersecting && !sayacBasladi.current) {
          sayacBasladi.current = true;
          sayacAnimasyonu();
        }
      },
      { threshold: 0.3 }
    );

    if (istatistikRef.current) {
      gozlemci.observe(istatistikRef.current);
    }

    return () => gozlemci.disconnect();
  }, []);

  const sayacAnimasyonu = () => {
    const hedefler = { tespit: 99.7, analiz: 500, koruma: 24, kural: 150 };
    const sure = 2000;
    const adim = 20;
    let adimSayisi = 0;
    const toplamAdim = sure / adim;

    const zamanlayici = setInterval(() => {
      adimSayisi++;
      const oran = adimSayisi / toplamAdim;
      const yumusatma = 1 - Math.pow(1 - oran, 3); // easeoutcubic

      setSayaclar({
        tespit: Math.min(parseFloat((hedefler.tespit * yumusatma).toFixed(1)), hedefler.tespit),
        analiz: Math.min(Math.floor(hedefler.analiz * yumusatma), hedefler.analiz),
        koruma: Math.min(Math.floor(hedefler.koruma * yumusatma), hedefler.koruma),
        kural: Math.min(Math.floor(hedefler.kural * yumusatma), hedefler.kural),
      });

      if (adimSayisi >= toplamAdim) {
        clearInterval(zamanlayici);
      }
    }, adim);
  };

  // matrix sütunları oluştur
  const matrixSutunlari = Array.from({ length: 20 }, (_, i) => {
    const metin = Array.from(
      { length: 30 },
      () => matrixKarakterleri[Math.floor(Math.random() * matrixKarakterleri.length)]
    ).join('');

    return (
      <div
        key={i}
        className="matrix-sutun"
        style={{
          left: `${(i / 20) * 100}%`,
          animationDuration: `${8 + Math.random() * 12}s`,
          animationDelay: `${Math.random() * 5}s`,
          fontSize: `${10 + Math.random() * 6}px`,
          opacity: 0.03 + Math.random() * 0.08,
        }}
      >
        {metin}
      </div>
    );
  });

  // özellikler verisi
  const ozellikler = [
    {
      ikon: Brain,
      baslik: 'AI Tehdit Analizi',
      aciklama: 'Yapay zeka ile şüpheli URL ve IP adreslerini analiz edin. Gerçek zamanlı tehdit tespiti.',
    },
    {
      ikon: Wifi,
      baslik: 'Ağ Güvenliği Taraması',
      aciklama: 'Ağınızdaki açık portları ve güvenlik açıklarını tespit edin.',
    },
    {
      ikon: Eye,
      baslik: 'Gerçek Zamanlı İzleme',
      aciklama: 'Sistemlerinizi 7/24 izleyin ve anlık tehdit bildirimleri alın.',
    },
    {
      ikon: FileText,
      baslik: 'Akıllı Raporlama',
      aciklama: 'Detaylı güvenlik raporları ve öneriler ile sistemlerinizi güçlendirin.',
    },
  ];

  return (
    <div className="ana-sayfa">
      {/* ===== kahraman bölümü ===== */}
      <section className="kahraman izgara-arkaplan">
        <div className="kahraman-arkaplan">
          {matrixSutunlari}
          <div className="kahraman-isik kahraman-isik-1" />
          <div className="kahraman-isik kahraman-isik-2" />
        </div>

        {/* yüzen ikonlar */}
        <div className="yuzen-ikonlar">
          {[Shield, Lock, Bug, Server, Radar, Zap].map((Ikon, i) => (
            <Ikon
              key={i}
              className="yuzen-ikon"
              size={24 + i * 4}
              style={{
                top: `${15 + Math.random() * 60}%`,
                left: `${5 + Math.random() * 85}%`,
                animationDuration: `${3 + i * 0.5}s`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className="kahraman-icerik">
          <div className="kahraman-rozet">
            <span className="kahraman-rozet-nokta" />
            Yapay Zeka Destekli Güvenlik
          </div>

          <h1 className="kahraman-baslik">
            <span className="kahraman-baslik-gradyan">Salus AI</span>
            <br />
            <span style={{ fontSize: '0.45em', fontWeight: 600, color: 'var(--metin)' }}>
              Yapay Zeka Destekli Siber Güvenlik Platformu
            </span>
          </h1>

          <p className="kahraman-altbaslik">
            Gelişmiş yapay zeka teknolojileri ile dijital varlıklarınızı koruyun.
            Tehdit analizi, ağ tarama ve gerçek zamanlı güvenlik izleme tek platformda.
          </p>

          <div className="kahraman-butonlar">
            <Link to="/kayit" className="buton buton-birincil">
              Hemen Başla
              <ArrowRight size={18} />
            </Link>
            <a href="#ozellikler" className="buton buton-hayalet">
              Daha Fazla Bilgi
            </a>
          </div>
        </div>
      </section>

      {/* ===== özellikler bölümü ===== */}
      <section className="ozellikler" id="ozellikler">
        <div className="bolum-baslik gorunur-animasyon">
          <p className="bolum-ust-etiket">Özellikler</p>
          <h2 className="bolum-ana-baslik">
            Kapsamlı <span className="gradyan-metin">Güvenlik Çözümleri</span>
          </h2>
          <p className="bolum-aciklama">
            En son yapay zeka teknolojileri ile donatılmış güvenlik araçlarımız ile
            dijital dünyada güvende kalın.
          </p>
        </div>

        <div className="ozellik-grid">
          {ozellikler.map((ozellik, indeks) => (
            <div
              key={indeks}
              className="ozellik-kart cam-kart gorunur-animasyon"
              style={{ transitionDelay: `${indeks * 0.1}s` }}
            >
              <div className="ozellik-ikon">
                <ozellik.ikon size={28} />
              </div>
              <h3 className="ozellik-baslik">{ozellik.baslik}</h3>
              <p className="ozellik-aciklama">{ozellik.aciklama}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== istatistikler bölümü ===== */}
      <section className="istatistikler" ref={istatistikRef}>
        <div className="bolum-baslik gorunur-animasyon">
          <p className="bolum-ust-etiket">Rakamlarla</p>
          <h2 className="bolum-ana-baslik">Güvenilir Performans</h2>
        </div>

        <div className="istatistik-grid">
          <div className="istatistik-oge gorunur-animasyon">
            <div className="istatistik-deger gradyan-metin">%{sayaclar.tespit}</div>
            <div className="istatistik-etiket">Tehdit Tespit Oranı</div>
          </div>
          <div className="istatistik-oge gorunur-animasyon" style={{ transitionDelay: '0.1s' }}>
            <div className="istatistik-deger gradyan-metin">{sayaclar.analiz}K+</div>
            <div className="istatistik-etiket">Analiz Yapıldı</div>
          </div>
          <div className="istatistik-oge gorunur-animasyon" style={{ transitionDelay: '0.2s' }}>
            <div className="istatistik-deger gradyan-metin">{sayaclar.koruma}/7</div>
            <div className="istatistik-etiket">Koruma</div>
          </div>
          <div className="istatistik-oge gorunur-animasyon" style={{ transitionDelay: '0.3s' }}>
            <div className="istatistik-deger gradyan-metin">{sayaclar.kural}+</div>
            <div className="istatistik-etiket">Güvenlik Kuralı</div>
          </div>
        </div>
      </section>

      {/* ===== nasıl çalışır bölümü ===== */}
      <section className="nasil-calisir">
        <div className="bolum-baslik gorunur-animasyon">
          <p className="bolum-ust-etiket">Süreç</p>
          <h2 className="bolum-ana-baslik">Nasıl Çalışır?</h2>
          <p className="bolum-aciklama">
            Üç basit adımda dijital güvenliğinizi artırın.
          </p>
        </div>

        <div className="adimlar">
          <div className="adim gorunur-animasyon">
            <div className="adim-numara">1</div>
            <h3 className="adim-baslik">Hedef Belirleyin</h3>
            <p className="adim-aciklama">
              Analiz etmek istediğiniz URL, IP adresi veya ağ bilgilerini girin.
            </p>
          </div>
          <div className="adim gorunur-animasyon" style={{ transitionDelay: '0.15s' }}>
            <div className="adim-numara">2</div>
            <h3 className="adim-baslik">AI Analiz Etsin</h3>
            <p className="adim-aciklama">
              Yapay zeka motorumuz hedefi derinlemesine tarar ve potansiyel tehditleri belirler.
            </p>
          </div>
          <div className="adim gorunur-animasyon" style={{ transitionDelay: '0.3s' }}>
            <div className="adim-numara">3</div>
            <h3 className="adim-baslik">Raporu Alın</h3>
            <p className="adim-aciklama">
              Detaylı güvenlik raporu ve öneriler ile sisteminizi güçlendirin.
            </p>
          </div>
        </div>
      </section>

      {/* ===== son çağrı bölümü ===== */}
      <section className="son-cagri">
        <div className="son-cagri-arkaplan" />
        <div className="son-cagri-icerik gorunur-animasyon">
          <h2 className="son-cagri-baslik">
            Güvenliğinizi <span className="gradyan-metin">Güçlendirin</span>
          </h2>
          <p className="son-cagri-aciklama">
            Hemen ücretsiz hesabınızı oluşturun ve yapay zeka destekli güvenlik
            araçlarımızı keşfedin. İlk adımı bugün atın.
          </p>
          <div className="kahraman-butonlar">
            <Link to="/kayit" className="buton buton-birincil">
              Ücretsiz Başla
              <ArrowRight size={18} />
            </Link>
            <Link to="/ai-sohbet" className="buton buton-ikincil">
              AI ile Sohbet Et
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnaSayfa;
