import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Wifi,
  Terminal,
  Brain,
  Lock,
  Hash,
  Globe,
  FileCode,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Zap,
  Check,
  Code2,
} from 'lucide-react';
import './AnaSayfa.css';

const AnaSayfa = () => {
  const navigate = useNavigate();
  const [hizliHedef, setHizliHedef] = useState('');
  const [seciliArac, setSeciliArac] = useState('tehdit');
  const [aktifSekme, setAktifSekme] = useState('tehdit');
  const [acikSss, setAcikSss] = useState(null);
  const [sayaclar, setSayaclar] = useState({ dogruluk: 0, analiz: 0, koruma: 0, kural: 0 });
  const istatistikRef = useRef(null);
  const sayacBasladi = useRef(false);

  // Sayaç animasyonu
  useEffect(() => {
    const gozlemci = new IntersectionObserver(
      (girdiler) => {
        if (girdiler[0].isIntersecting && !sayacBasladi.current) {
          sayacBasladi.current = true;
          sayacCalistir();
        }
      },
      { threshold: 0.2 }
    );

    if (istatistikRef.current) {
      gozlemci.observe(istatistikRef.current);
    }
    return () => gozlemci.disconnect();
  }, []);

  const sayacCalistir = () => {
    const hedefler = { dogruluk: 99.8, analiz: 500, koruma: 24, kural: 150 };
    const sure = 1800;
    const adim = 20;
    let adimSayisi = 0;
    const toplamAdim = sure / adim;

    const zamanlayici = setInterval(() => {
      adimSayisi++;
      const oran = adimSayisi / toplamAdim;
      const yumusatma = 1 - Math.pow(1 - oran, 3);

      setSayaclar({
        dogruluk: Math.min(parseFloat((hedefler.dogruluk * yumusatma).toFixed(1)), hedefler.dogruluk),
        analiz: Math.min(Math.floor(hedefler.analiz * yumusatma), hedefler.analiz),
        koruma: Math.min(Math.floor(hedefler.koruma * yumusatma), hedefler.koruma),
        kural: Math.min(Math.floor(hedefler.kural * yumusatma), hedefler.kural),
      });

      if (adimSayisi >= toplamAdim) {
        clearInterval(zamanlayici);
      }
    }, adim);
  };

  // Hızlı arama / analiz başlatıcı
  const hizliAnalizBaslat = (e) => {
    e.preventDefault();
    if (!hizliHedef.trim()) return;

    if (seciliArac === 'tehdit') {
      navigate('/tehdit-analiz');
    } else if (seciliArac === 'ip') {
      navigate('/araclar/ip-sorgu');
    } else if (seciliArac === 'ag') {
      navigate('/ag-tarama');
    } else if (seciliArac === 'subdomain') {
      navigate('/araclar/subdomain');
    } else if (seciliArac === 'header') {
      navigate('/araclar/header');
    }
  };

  // 8 Çekirdek Siber Araç
  const araclar = [
    {
      id: 'tehdit',
      baslik: 'AI Tehdit Analizi',
      aciklama: 'URL, domain ve IP adreslerini yapay zeka ile tarayın, risk skorlarını milisaniyeler içinde çıkarın.',
      ikon: Search,
      yol: '/tehdit-analiz',
      etiket: 'Canlı Tarama',
    },
    {
      id: 'ag',
      baslik: 'Ağ & Port Keşfi',
      aciklama: 'Hedef sistem üzerindeki açık portları, çalışan servisleri ve olası konfigürasyon açıklarını tespit edin.',
      ikon: Wifi,
      yol: '/ag-tarama',
      etiket: 'Port Taraması',
    },
    {
      id: 'log',
      baslik: 'Akıllı Log Analizi',
      aciklama: 'Nmap ve sistem denetim loglarını yapay zeka ile çözümleyin, güvenlik açığı (CVE) eşleştirmelerini görün.',
      ikon: Terminal,
      yol: '/log-analiz',
      etiket: 'Anomali Tespiti',
    },
    {
      id: 'sohbet',
      baslik: 'AI Güvenlik Asistanı',
      aciklama: 'Siber güvenlik stratejileri, zafiyet kapatma rehberleri ve kod denetimleri için 7/24 AI danışman.',
      ikon: Brain,
      yol: '/ai-sohbet',
      etiket: '7/24 Aktif',
    },
    {
      id: 'sifre',
      baslik: 'Şifre Araçları',
      aciklama: 'Parola entropi analizi yapın ve kriptografik olarak rastgele, tahmin edilemez şifreler üretin.',
      ikon: Lock,
      yol: '/araclar/sifre',
      etiket: 'Kripto',
    },
    {
      id: 'kripto',
      baslik: 'Hash & Kod Çözücü',
      aciklama: 'Bilinmeyen hash tiplerini tanımlayın; çok katmanlı Base64, Hex ve URL formatlarını dönüştürün.',
      ikon: Hash,
      yol: '/araclar/kripto',
      etiket: 'Format Dönüştürücü',
    },
    {
      id: 'ip',
      baslik: 'IP & OSINT İstihbarat',
      aciklama: 'Coğrafi konum, ISP, VPN/Tor tespiti ve tehdit istihbarat verilerini tek sorguda görüntüleyin.',
      ikon: Globe,
      yol: '/araclar/ip-sorgu',
      etiket: 'GeoIP & ISP',
    },
    {
      id: 'header',
      baslik: 'Güvenlik Başlıkları',
      aciklama: 'Web sitelerinin CSP, HSTS, X-Frame-Options güvenlik başlıklarını puanlayıp zafiyetleri listeleyin.',
      ikon: FileCode,
      yol: '/araclar/header',
      etiket: 'A-F Skorlama',
    },
  ];

  // SSS Soruları
  const sssListesi = [
    {
      soru: 'Salus AI nasıl çalışır ve hangi altyapıyı kullanır?',
      cevap: 'Salus AI, Google Gemini API modelleri ve yerel siber analiz motorları (OSINT, Nmap, DNS/Whois, Header Analyzer) ile entegre çalışarak tüm güvenlik verilerini tek bir arayüzde birleştirir.',
    },
    {
      soru: 'Yapılan taramalar hedef sistemlere zarar verir mi?',
      cevap: 'Hayır. Salus AI araçları yalnızca kamuya açık istihbarat (OSINT) ve standart ağ keşif sorguları gerçekleştirir; sisteme zarar verici herhangi bir sömürü (exploit) eylemi içermez.',
    },
    {
      soru: 'Platformda denetim ve aktivite günlükleri tutuluyor mu?',
      cevap: 'Evet. Gerçekleştirilen tüm kimlik doğrulama işlemleri ve güvenlik taramaları, yöneticilerin izleyebileceği denetim günlüklerinde (Audit Logs) güvenle kayıt altına alınır.',
    },
    {
      soru: 'Salus AI araçlarını API veya harici yazılımlarla kullanabilir miyim?',
      cevap: 'Evet. Profil ve Ayarlar bölümünden erişilebilen API anahtarları sayesinde analiz modüllerini kendi yazılımlarınıza veya CI/CD boru hatlarınıza entegre edebilirsiniz.',
    },
  ];

  return (
    <div className="ana-sayfa">
      {/* ===== KAHRAMAN BÖLÜMÜ (HERO) ===== */}
      <section className="kahraman-sade">
        <div className="kahraman-kapsayici">
          <div className="kahraman-rozet">
            <span className="rozet-nokta" />
            <span>Salus AI Platform 2.0</span>
          </div>

          <h1 className="kahraman-baslik">
            Yapay Zeka Destekli <br />
            <span className="gradyan-metin">Siber Güvenlik Ekosistemi</span>
          </h1>

          <p className="kahraman-altbaslik">
            Ağ keşfi, tehdit istihbaratı, zafiyet tespiti ve 7/24 yapay zeka danışmanı tek bir sade, güçlü ve hızlı platformda.
          </p>

          {/* Hızlı Arama & Araç Başlatıcı */}
          <form className="hizli-tarayici-kutusu" onSubmit={hizliAnalizBaslat}>
            <div className="hizli-tarayici-secici">
              <select
                value={seciliArac}
                onChange={(e) => setSeciliArac(e.target.value)}
                className="hizli-arac-select"
              >
                <option value="tehdit">Tehdit Analizi</option>
                <option value="ip">IP İstihbaratı</option>
                <option value="ag">Ağ & Port Taraması</option>
                <option value="subdomain">Subdomain Keşfi</option>
                <option value="header">Güvenlik Başlıkları</option>
              </select>
            </div>

            <div className="hizli-tarayici-input-alani">
              <Search size={18} className="hizli-arama-ikon" />
              <input
                type="text"
                className="hizli-input"
                placeholder={
                  seciliArac === 'tehdit' ? 'URL veya IP adresi (örn: example.com)' :
                  seciliArac === 'ip' ? 'IP adresi (örn: 8.8.8.8)' :
                  seciliArac === 'ag' ? 'Hedef host (örn: 192.168.1.1)' :
                  seciliArac === 'subdomain' ? 'Alan adı (örn: target.com)' :
                  'Web sitesi adresi (örn: https://example.com)'
                }
                value={hizliHedef}
                onChange={(e) => setHizliHedef(e.target.value)}
              />
            </div>

            <button type="submit" className="buton buton-birincil hizli-buton">
              Analiz Et <ArrowRight size={16} />
            </button>
          </form>

          {/* Hızlı Etiketler */}
          <div className="hizli-etiketler">
            <span className="hizli-etiket-baslik">Hızlı Erişim:</span>
            <Link to="/tehdit-analiz" className="hizli-etiket-link">Tehdit Taraması</Link>
            <Link to="/ai-sohbet" className="hizli-etiket-link">AI Danışman</Link>
            <Link to="/ag-tarama" className="hizli-etiket-link">Ağ Analizi</Link>
            <Link to="/log-analiz" className="hizli-etiket-link">Log Çözümleyici</Link>
          </div>
        </div>
      </section>

      {/* ===== İNTERAKTİF ÖZELLİK VİTRİNİ (DEMO / PREVIEW) ===== */}
      <section className="vitrin-bolumu">
        <div className="vitrin-kapsayici">
          <div className="bolum-baslik">
            <p className="bolum-ust-etiket">Canlı Önizleme</p>
            <h2 className="bolum-ana-baslik">Güçlü Yetenekler, Minimal Arayüz</h2>
            <p className="bolum-aciklama">
              Gereksiz karmaşıklıktan arındırılmış, doğrudan sonuca ve aksiyona odaklanan modern güvenlik araçları.
            </p>
          </div>

          {/* Sekme Butonları */}
          <div className="vitrin-sekmeler">
            <button
              className={`vitrin-sekme-buton ${aktifSekme === 'tehdit' ? 'aktif' : ''}`}
              onClick={() => setAktifSekme('tehdit')}
            >
              <Search size={16} /> Tehdit Analizi
            </button>
            <button
              className={`vitrin-sekme-buton ${aktifSekme === 'ag' ? 'aktif' : ''}`}
              onClick={() => setAktifSekme('ag')}
            >
              <Wifi size={16} /> Ağ & Port Keşfi
            </button>
            <button
              className={`vitrin-sekme-buton ${aktifSekme === 'log' ? 'aktif' : ''}`}
              onClick={() => setAktifSekme('log')}
            >
              <Terminal size={16} /> Akıllı Log Analizi
            </button>
            <button
              className={`vitrin-sekme-buton ${aktifSekme === 'ai' ? 'aktif' : ''}`}
              onClick={() => setAktifSekme('ai')}
            >
              <Brain size={16} /> AI Asistan
            </button>
          </div>

          {/* Sekme İçerikleri */}
          <div className="vitrin-icerik-kart cam-kart">
            {aktifSekme === 'tehdit' && (
              <div className="vitrin-panel">
                <div className="vitrin-panel-sol">
                  <div className="vitrin-panel-rozet">
                    <span className="rozet rozet-bilgi">Skorlama Motoru</span>
                  </div>
                  <h3>Derinlemesine Tehdit İstihbaratı</h3>
                  <p>
                    URL ve IP adreslerini global tehdit veritabanları, DNS kayıtları ve yapay zeka analiz motoru ile eş zamanlı denetleyin.
                  </p>
                  <ul className="vitrin-liste">
                    <li><CheckCircle2 size={16} className="ikon-basari" /> 0-day güvenlik açığı tahmini</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> SSL/TLS sertifika doğrulama</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Dinamik risk skoru (0 - 100)</li>
                  </ul>
                  <Link to="/tehdit-analiz" className="buton buton-birincil buton-kucuk">
                    Tehdit Aracını Aç <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="vitrin-panel-sag">
                  <div className="demo-rapor-kart">
                    <div className="demo-rapor-ust">
                      <div>
                        <span className="demo-hedef">target-security-check.io</span>
                        <div className="demo-tarih">Bugün, 18:24 · Tam Analiz</div>
                      </div>
                      <span className="rozet rozet-basari">Düşük Risk (12/100)</span>
                    </div>
                    <div className="demo-bulgular">
                      <div className="demo-bulgu-satir basari">
                        <Check size={14} /> SSL Sertifikası: Geçerli (Let's Encrypt RSA 2048)
                      </div>
                      <div className="demo-bulgu-satir basari">
                        <Check size={14} /> Güvenlik Başlıkları: HSTS & CSP Aktif
                      </div>
                      <div className="demo-bulgu-satir uyari">
                        <Activity size={14} /> Bilgi: 2 açık servis tespit edildi (80/http, 443/https)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aktifSekme === 'ag' && (
              <div className="vitrin-panel">
                <div className="vitrin-panel-sol">
                  <div className="vitrin-panel-rozet">
                    <span className="rozet rozet-birincil">Ağ Taraması</span>
                  </div>
                  <h3>Hassas Port ve Servis Analizi</h3>
                  <p>
                    Ağınızdaki açık noktaları, standart dışı port dinleyicilerini ve servis sürüm zafiyetlerini tespit edin.
                  </p>
                  <ul className="vitrin-liste">
                    <li><CheckCircle2 size={16} className="ikon-basari" /> TCP / UDP servis keşfi</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Filtrelenmiş / açık port ayrımı</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Sürüm ve banner grab analizi</li>
                  </ul>
                  <Link to="/ag-tarama" className="buton buton-birincil buton-kucuk">
                    Ağ Taramasını Başlat <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="vitrin-panel-sag">
                  <div className="demo-terminal">
                    <div className="demo-terminal-bar">
                      <span className="terminal-dot red" />
                      <span className="terminal-dot yellow" />
                      <span className="terminal-dot green" />
                      <span className="terminal-title">salus-scanner v2.4</span>
                    </div>
                    <div className="demo-terminal-content">
                      <div><span style={{ color: '#0071e3' }}>$</span> salus-scan --target 192.168.1.100</div>
                      <div style={{ color: '#30d158' }}>[+] Host is UP (latency: 0.0018s)</div>
                      <div>PORT     STATE  SERVICE     VERSION</div>
                      <div>22/tcp   open   ssh         OpenSSH 8.9p1</div>
                      <div>80/tcp   open   http        nginx 1.18.0</div>
                      <div>443/tcp  open   ssl/https   nginx 1.18.0</div>
                      <div style={{ color: '#30d158' }}>[+] 3 open ports verified. No critical CVE matched.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aktifSekme === 'log' && (
              <div className="vitrin-panel">
                <div className="vitrin-panel-sol">
                  <div className="vitrin-panel-rozet">
                    <span className="rozet rozet-uyari">Log Motoru</span>
                  </div>
                  <h3>Yapay Zeka ile Anomali Çözümleme</h3>
                  <p>
                    Karmaşık sunucu loglarını ve tarama çıktılarını yapay zeka modelleriyle anlaşılır güvenlik raporlarına dönüştürün.
                  </p>
                  <ul className="vitrin-liste">
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Otomatik Nmap ve Syslog ayrıştırma</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> CVE referansları ve çözüm rehberleri</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Hızlı panoya kopyalama ve raporlama</li>
                  </ul>
                  <Link to="/log-analiz" className="buton buton-birincil buton-kucuk">
                    Log Analizine Git <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="vitrin-panel-sag">
                  <div className="demo-rapor-kart">
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--metin)', marginBottom: '10px' }}>
                      Özet Çözümleme Raporu
                    </div>
                    <div style={{ background: 'var(--yuzey-acik)', padding: '12px', borderRadius: '10px', fontSize: '0.82rem', fontFamily: 'var(--font-kod)', color: 'var(--metin-soluk)', marginBottom: '12px' }}>
                      Tespit: 1 Kritik, 2 Orta Derece Zafiyet
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--metin-soluk)', lineHeight: '1.5' }}>
                      Yapay zeka önerisi: SSH servisi için parola ile girişleri devre dışı bırakıp anahtar tabanlı yetkilendirme (Ed25519) aktif edin.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aktifSekme === 'ai' && (
              <div className="vitrin-panel">
                <div className="vitrin-panel-sol">
                  <div className="vitrin-panel-rozet">
                    <span className="rozet rozet-bilgi">AI Danışman</span>
                  </div>
                  <h3>7/24 Siber Güvenlik Asistanı</h3>
                  <p>
                    Güvenlik mimarisi, kod denetimi, sızma testi metotları ve kural yapılandırmaları için anlık destek alın.
                  </p>
                  <ul className="vitrin-liste">
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Kod güvenliği (SAST) incelemeleri</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Firewall ve WAF kuralı oluşturma</li>
                    <li><CheckCircle2 size={16} className="ikon-basari" /> Olay müdahale (Incident Response) adımları</li>
                  </ul>
                  <Link to="/ai-sohbet" className="buton buton-birincil buton-kucuk">
                    Sohbete Başla <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="vitrin-panel-sag">
                  <div className="demo-chat-box">
                    <div className="demo-chat-msg user">
                      SQL Injection açıklarına karşı Express.js'te en güvenli yöntem nedir?
                    </div>
                    <div className="demo-chat-msg ai">
                      Parametreli sorgular (Prepared Statements) veya ORM (Knex/Prisma) kullanmak en güvenli yaklaşımdır. Asla kullanıcı girdilerini raw SQL dizilerine birleştirmeyin.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== SİBER ARAÇ KUTUSU (8 ÇEKİRDEK ARAÇ) ===== */}
      <section className="araclar-bolumu" id="araclar">
        <div className="bolum-baslik">
          <p className="bolum-ust-etiket">Araç Seti</p>
          <h2 className="bolum-ana-baslik">Kapsamlı Siber Güvenlik Çözümleri</h2>
          <p className="bolum-aciklama">
            Geliştiriciler, sistem yöneticileri ve güvenlik araştırmacıları için optimize edilmiş araçlar.
          </p>
        </div>

        <div className="araclar-grid">
          {araclar.map((arac) => (
            <Link key={arac.id} to={arac.yol} className="arac-kart cam-kart">
              <div className="arac-kart-ust">
                <div className="arac-ikon-kutusu">
                  <arac.ikon size={20} />
                </div>
                <span className="arac-etiket">{arac.etiket}</span>
              </div>
              <h3 className="arac-baslik">{arac.baslik}</h3>
              <p className="arac-aciklama">{arac.aciklama}</p>
              <div className="arac-link-metin">
                Aracı Başlat <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== RAKAMLAR VE PERFORMANS ===== */}
      <section className="istatistikler-sade" ref={istatistikRef}>
        <div className="istatistik-kapsayici">
          <div className="istatistik-oge">
            <div className="istatistik-deger">%{sayaclar.dogruluk}</div>
            <div className="istatistik-etiket">Tehdit Tespit Doğruluğu</div>
          </div>
          <div className="istatistik-oge">
            <div className="istatistik-deger">{sayaclar.analiz}K+</div>
            <div className="istatistik-etiket">Tamamlanan Analiz</div>
          </div>
          <div className="istatistik-oge">
            <div className="istatistik-deger">{sayaclar.koruma}/7</div>
            <div className="istatistik-etiket">Kesintisiz İzleme</div>
          </div>
          <div className="istatistik-oge">
            <div className="istatistik-deger">{sayaclar.kural}+</div>
            <div className="istatistik-etiket">Dinamik Savunma Kuralı</div>
          </div>
        </div>
      </section>

      {/* ===== SİSTEM GÜVENLİĞİ VE MİMARİ ===== */}
      <section className="mimari-bolum">
        <div className="mimari-kapsayici">
          <div className="bolum-baslik">
            <p className="bolum-ust-etiket">Güvenlik Mimarisi</p>
            <h2 className="bolum-ana-baslik">Zırhlı ve Dayanıklı Altyapı</h2>
            <p className="bolum-aciklama">
              Salus AI, kurumsal düzeyde savunma katmanları ve yüksek erişilebilirlik standartları üzerine kurulmuştur.
            </p>
          </div>

          <div className="mimari-grid">
            <div className="mimari-kart cam-kart">
              <div className="mimari-ikon"><Cpu size={22} /></div>
              <h3>Circuit Breaker (Devre Kesici)</h3>
              <p>Hassas rotalarda ardışık 5 sunucu hatası durumunda rotaları otomatik korumaya alarak sistemin çökmesini engeller.</p>
            </div>

            <div className="mimari-kart cam-kart">
              <div className="mimari-ikon"><Layers size={22} /></div>
              <h3>Dinamik Rate Limiting</h3>
              <p>Küresel istek sınırlandırması ve giriş denemeleri için sıkılaştırılmış limitör ile brute-force ataklarını engeller.</p>
            </div>

            <div className="mimari-kart cam-kart">
              <div className="mimari-ikon"><Shield size={22} /></div>
              <h3>BcryptJS & Audit Logs</h3>
              <p>Parolalar 12 salt turuyla şifrelenir; kritik oturum ve tarama aksiyonları denetim günlüklerine yazılır.</p>
            </div>

            <div className="mimari-kart cam-kart">
              <div className="mimari-ikon"><Zap size={22} /></div>
              <h3>Slowloris & Girdi Filtreleme</h3>
              <p>TCP bağlantı zaman aşımları, HTTP başlık kontrolleri ve XSS/SQLi temizleme filtreleri ile tam koruma.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SSS (SIKÇA SORULAN SORULAR) ===== */}
      <section className="sss-bolumu">
        <div className="sss-kapsayici">
          <div className="bolum-baslik">
            <p className="bolum-ust-etiket">Bilgi Merkezi</p>
            <h2 className="bolum-ana-baslik">Sıkça Sorulan Sorular</h2>
          </div>

          <div className="sss-akordiyon">
            {sssListesi.map((item, index) => {
              const acik = acikSss === index;
              return (
                <div key={index} className="sss-oge cam-kart">
                  <button
                    className="sss-soru-buton"
                    onClick={() => setAcikSss(acik ? null : index)}
                  >
                    <span>{item.soru}</span>
                    <ChevronDown size={18} className={`sss-chevron ${acik ? 'dondur' : ''}`} />
                  </button>
                  {acik && (
                    <div className="sss-cevap">
                      {item.cevap}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== ÇAĞRI (CTA) BÖLÜMÜ ===== */}
      <section className="cta-sade">
        <div className="cta-kapsayici cam-kart">
          <h2>Dijital Varlıklarınızı Bugün Güvenceye Alın</h2>
          <p>
            Salus AI platformuna ücretsiz kaydolun, siber güvenlik tehditlerini saldırganlardan önce tespit edin.
          </p>
          <div className="cta-butonlar">
            <Link to="/kayit" className="buton buton-birincil">
              Hemen Başla <ArrowRight size={16} />
            </Link>
            <Link to="/ai-sohbet" className="buton buton-ikincil">
              AI Danışmana Soru Sor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnaSayfa;
