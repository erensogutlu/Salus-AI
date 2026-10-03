import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Bot,
  Plus,
  MessageSquare,
  Trash2,
  Menu,
  X,
  Shield,
  Copy,
  Check,
  RotateCcw,
  Download,
  Search,
  Sparkles,
  Lock,
  Globe,
  ChevronDown,
  Terminal
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { aiMesajGonder, aiGecmisGetir, sohbetSil } from '../servisler/apiServisi';
import './AiSohbet.css';

// başlangıç soru şablonları
const SOHBET_KATEGORILERI = [
  {
    id: 'zafiyet',
    etiket: 'Tehdit & Zafiyet',
    ikon: Shield,
    oneriler: [
      { baslik: 'SQL Injection Korunması', aciklama: 'SQLi zafiyeti nasıl tespit edilir ve parametreli sorgularla nasıl engellenir?', komut: 'SQL Injection saldırısı nedir, tespit yöntemleri ve parameterized queries ile korunma yolları nelerdir?' },
      { baslik: 'OWASP Top 10 Özeti', aciklama: 'Modern web uygulamalarında en kritik 10 güvenlik riski ve savunma yöntemleri.', komut: 'OWASP Top 10 güvenlik risklerini ve geliştiriciler için en kritik savunma adımlarını açıkla.' },
      { baslik: 'XSS ve CSP Yapılandırması', aciklama: 'Cross-Site Scripting saldırıları ve Content Security Policy kullanımı.', komut: 'XSS (Cross-Site Scripting) türleri nelerdir ve CSP başlıklarıyla nasıl engellenir?' },
    ]
  },
  {
    id: 'ag',
    etiket: 'Ağ & Web Güvenliği',
    ikon: Globe,
    oneriler: [
      { baslik: 'Port ve Servis Analizi', aciklama: '21, 22, 80, 443, 3389 portlarının risk değerlendirmesi.', komut: 'Açık portların (21, 22, 80, 443, 3389, 8080) siber güvenlik risklerini ve sıkılaştırma adımlarını listele.' },
      { baslik: 'DDoS Savunma Stratejisi', aciklama: 'Hacimsel ve uygulama katmanı DDoS saldırılarına karşı koruma mimarisi.', komut: 'DDoS saldırı türleri (SYN Flood, HTTP Flood, Amplification) ve Cloudflare/WAF ile korunma stratejisi nedir?' },
      { baslik: 'Subdomain Takeover Tespiti', aciklama: 'Yetim DNS ve CNAME kayıtlarının istismar edilmesini engelleme.', komut: 'Subdomain Takeover zafiyeti nasıl oluşur, tespiti ve DNS temizliği nasıl yapılır?' },
    ]
  },
  {
    id: 'kripto',
    etiket: 'Kripto & Parola',
    ikon: Lock,
    oneriler: [
      { baslik: 'Güvenli Parola Hashleme', aciklama: 'Argon2id, bcrypt ve PBKDF2 algoritmalarının karşılaştırması.', komut: 'Parola saklama için Argon2id, bcrypt ve PBKDF2 arasındaki farklar nelerdir? Neden MD5 ve SHA1 kullanılmamalıdır?' },
      { baslik: 'SSL/TLS ve HSTS Sıkılaştırma', aciklama: 'HTTPS yönlendirmesi ve Strict-Transport-Security başlığı.', komut: 'Modern TLS 1.3 yapılandırması ve HSTS başlığının güvenli uygulanması nasıl olmalıdır?' },
      { baslik: 'MFA / 2FA Entegrasyonu', aciklama: 'TOTP tabanlı iki faktörlü doğrulama mimarisi.', komut: 'TOTP (Time-based One-Time Password) standardı ile 2FA güvenliği nasıl sağlanır?' },
    ]
  },
  {
    id: 'soc',
    etiket: 'Log & Forensics',
    ikon: Terminal,
    oneriler: [
      { baslik: 'Web Sunucu Log İnceleme', aciklama: 'Apache/Nginx access loglarında şüpheli paternlerin tespiti.', komut: 'Nginx ve Apache erişim günlüklerinde (access.log) brute-force ve path traversal saldırıları nasıl tespit edilir?' },
      { baslik: 'Oltalama (Phishing) Analizi', aciklama: 'Şüpheli e-posta başlıkları, SPF/DKIM ve DMARC doğrulaması.', komut: 'Sahte ve oltalama (phishing) e-postaları nasıl analiz edilir? SPF, DKIM ve DMARC protokollerinin rolü nedir?' },
      { baslik: 'Olay Müdahale Planı (IRP)', aciklama: 'Bir siber saldırı anında ilk 24 saatte yapılması gerekenler.', komut: 'Siber saldırı durumunda Olay Müdahale (Incident Response) adımları (NIST standartlarına göre) nelerdir?' },
    ]
  }
];

// hızlı komut çipleri
const HIZLI_KOMUTLAR = [
  { etiket: '🛡️ Port Güvenliği', metin: 'Standart portların siber güvenlik zafiyetleri ve sıkılaştırma önerilerini listele.' },
  { etiket: '🔑 Güçlü Şifre Standartları', metin: 'NIST parola kılavuzuna göre güçlü bir şifre politikasının kriterleri nelerdir?' },
  { etiket: '🌐 DNS Güvenlik Kontrolleri', metin: 'DNSSEC, DoH ve güvenli DNS sorgulaması hakkında detaylı bilgi ver.' },
  { etiket: '🧬 Hash Çözümleme', metin: 'Bilinen hash algoritmaları (MD5, SHA256, bcrypt, Argon2) nasıl ayırt edilir?' },
  { etiket: '🔍 SQLi & XSS Savunması', metin: 'Web uygulamalarında SQLi ve XSS zafiyetlerine karşı kodlama seviyesinde savunma rehberi hazırla.' }
];

const AiSohbet = () => {
  const { kullanici } = useYetkilendirme();
  const [mesajlar, setMesajlar] = useState([]);
  const [giris, setGiris] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(false);
  const [sohbetler, setSohbetler] = useState([]);
  const [tamGecmis, setTamGecmis] = useState([]);
  const [aktifSohbet, setAktifSohbet] = useState(null);
  const [aramaMetni, setAramaMetni] = useState('');
  const [kategoriSecili, setKategoriSecili] = useState('zafiyet');
  const [kopyalandiId, setKopyalandiId] = useState(null);
  const [asagiKaydirGoster, setAsagiKaydirGoster] = useState(false);

  const mesajlarSonuRef = useRef(null);
  const mesajlarAlaniRef = useRef(null);
  const girisRef = useRef(null);

  // zaman formatlayıcı
  const zamanFormatla = () => {
    const simdi = new Date();
    return simdi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // kullanıcı avatar harfi
  const basHarf = kullanici?.tam_ad
    ? kullanici.tam_ad.charAt(0).toUpperCase()
    : kullanici?.kullanici_adi
    ? kullanici.kullanici_adi.charAt(0).toUpperCase()
    : 'M';

  // geçmiş yükleme (oturum açmışsa sunucudan, misafir ise localstorage'dan)
  useEffect(() => {
    const gecmisiYukle = async () => {
      if (kullanici) {
        try {
          const yanit = await aiGecmisGetir();
          if (yanit.basarili && yanit.veri) {
            const gecmis = yanit.veri;
            setTamGecmis(gecmis);
            
            const oturumlar = {};
            const siraliGecmis = [...gecmis].reverse();
            
            siraliGecmis.forEach(g => {
              if (!oturumlar[g.oturum_id]) {
                oturumlar[g.oturum_id] = {
                  id: g.oturum_id,
                  baslik: g.mesaj.length > 32 ? g.mesaj.substring(0, 32) + '...' : g.mesaj,
                  tarih: new Date(g.olusturulma_tarihi).toLocaleDateString('tr-TR'),
                  olusturulma_tarihi: g.olusturulma_tarihi
                };
              } else {
                oturumlar[g.oturum_id].olusturulma_tarihi = g.olusturulma_tarihi;
              }
            });
            
            const konular = Object.values(oturumlar).sort((a, b) => new Date(b.olusturulma_tarihi) - new Date(a.olusturulma_tarihi));
            setSohbetler(konular);
          }
        } catch (hata) {
          console.error('geçmiş yüklenemedi', hata);
        }
      } else {
        // misafir yerel hafızası
        try {
          const yerelGecmis = localStorage.getItem('salus_misafir_sohbetler');
          if (yerelGecmis) {
            const parsed = JSON.parse(yerelGecmis);
            setSohbetler(parsed.sohbetler || []);
            setTamGecmis(parsed.tamGecmis || []);
          }
        } catch (e) {
          console.error('misafir geçmişi okunamadı', e);
        }
      }
    };
    gecmisiYukle();
  }, [kullanici]);

  // otomatik aşağı kaydırma
  const asagiKaydir = useCallback((yumusak = true) => {
    if (mesajlarSonuRef.current) {
      mesajlarSonuRef.current.scrollIntoView({ behavior: yumusak ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    asagiKaydir();
  }, [mesajlar, yukleniyor, asagiKaydir]);

  // kaydırma pozisyonu takibi (aşağı kaydır butonu için)
  const kaydirmaKontrol = () => {
    if (!mesajlarAlaniRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mesajlarAlaniRef.current;
    const dipteMi = scrollHeight - scrollTop - clientHeight < 120;
    setAsagiKaydirGoster(!dipteMi && mesajlar.length > 0);
  };

  // textarea yüksekliğini otomatik ayarla
  const girisYuksekliginiAyarla = () => {
    if (girisRef.current) {
      girisRef.current.style.height = 'auto';
      girisRef.current.style.height = `${Math.min(girisRef.current.scrollHeight, 130)}px`;
    }
  };

  useEffect(() => {
    girisYuksekliginiAyarla();
  }, [giris]);

  // mesaj gönderme
  const mesajGonder = async (metin = null) => {
    const mesajMetni = (metin || giris).trim();
    if (!mesajMetni || yukleniyor) return;

    const kullaniciMesaji = {
      id: `k-${Date.now()}`,
      tip: 'kullanici',
      icerik: mesajMetni,
      zaman: zamanFormatla(),
    };

    setMesajlar((onceki) => [...onceki, kullaniciMesaji]);
    setGiris('');
    setYukleniyor(true);

    if (girisRef.current) {
      girisRef.current.style.height = 'auto';
    }

    try {
      const yanit = await aiMesajGonder(mesajMetni, aktifSohbet);
      const yeniOturumId = yanit?.veri?.oturum_id || aktifSohbet || Date.now().toString();
      const aiIcerik = yanit?.veri?.yanit || yanit?.mesaj || yanit?.yanit || yanit?.response || 'Yanıt oluşturuldu.';

      const aiMesaji = {
        id: `a-${Date.now() + 1}`,
        tip: 'ai',
        icerik: aiIcerik,
        zaman: zamanFormatla(),
      };
      setMesajlar((onceki) => [...onceki, aiMesaji]);

      const kayitOgesi = {
        id: yanit?.veri?.id || Date.now(),
        oturum_id: yeniOturumId,
        mesaj: mesajMetni,
        yanit: aiIcerik,
        olusturulma_tarihi: yanit?.veri?.olusturulma_tarihi || new Date().toISOString()
      };

      if (kullanici) {
        setTamGecmis(onceki => [kayitOgesi, ...onceki]);
        setSohbetler(onceki => {
          const varSohbet = onceki.find(s => s.id === yeniOturumId);
          if (varSohbet) {
            const guncelSohbet = { ...varSohbet, olusturulma_tarihi: kayitOgesi.olusturulma_tarihi };
            return [guncelSohbet, ...onceki.filter(s => s.id !== yeniOturumId)];
          } else {
            return [{
              id: yeniOturumId,
              baslik: mesajMetni.length > 32 ? mesajMetni.substring(0, 32) + '...' : mesajMetni,
              tarih: new Date().toLocaleDateString('tr-TR'),
              olusturulma_tarihi: kayitOgesi.olusturulma_tarihi
            }, ...onceki];
          }
        });
      } else {
        // misafir yerel kayıt
        const yeniTamGecmis = [kayitOgesi, ...tamGecmis];
        const varSohbet = sohbetler.find(s => s.id === yeniOturumId);
        let yeniSohbetler;
        if (varSohbet) {
          yeniSohbetler = [{ ...varSohbet, olusturulma_tarihi: kayitOgesi.olusturulma_tarihi }, ...sohbetler.filter(s => s.id !== yeniOturumId)];
        } else {
          yeniSohbetler = [{
            id: yeniOturumId,
            baslik: mesajMetni.length > 32 ? mesajMetni.substring(0, 32) + '...' : mesajMetni,
            tarih: new Date().toLocaleDateString('tr-TR'),
            olusturulma_tarihi: kayitOgesi.olusturulma_tarihi
          }, ...sohbetler];
        }
        setTamGecmis(yeniTamGecmis);
        setSohbetler(yeniSohbetler);
        localStorage.setItem('salus_misafir_sohbetler', JSON.stringify({ sohbetler: yeniSohbetler, tamGecmis: yeniTamGecmis }));
      }

      if (!aktifSohbet) {
        setAktifSohbet(yeniOturumId);
      }
    } catch (hata) {
      // offline / demo fallback
      const aiMesaji = {
        id: `a-${Date.now() + 1}`,
        tip: 'ai',
        icerik: `İsteğiniz işlendi. "${mesajMetni}" konusunda siber güvenlik önerisi:\n\n- Sistemlerinizi düzenli olarak zafiyet taramalarına tabi tutun.\n- Açık port ve servisleri en aza indirgeyin.\n- HTTPS ve güçlü şifreleme protokollerini (TLS 1.3) etkinleştirin.\n\nDetaylı analiz için araçlar menümüzdeki ilgili modülü de kullanabilirsiniz.`,
        zaman: zamanFormatla(),
      };
      setMesajlar((onceki) => [...onceki, aiMesaji]);
    } finally {
      setYukleniyor(false);
    }
  };

  // enter tuş kontrolü
  const tusKontrol = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      mesajGonder();
    }
  };

  // yeni sohbet başlat
  const yeniSohbet = () => {
    setMesajlar([]);
    setAktifSohbet(null);
    setGecmisAcik(false);
    if (girisRef.current) girisRef.current.focus();
  };

  // sohbet sil
  const sohbetSilIsle = async (e, id) => {
    e.stopPropagation();
    try {
      if (kullanici) {
        await sohbetSil(id);
      }
      const guncelSohbetler = sohbetler.filter((s) => s.id !== id);
      const guncelTam = tamGecmis.filter((s) => s.oturum_id !== id);
      setSohbetler(guncelSohbetler);
      setTamGecmis(guncelTam);
      if (!kullanici) {
        localStorage.setItem('salus_misafir_sohbetler', JSON.stringify({ sohbetler: guncelSohbetler, tamGecmis: guncelTam }));
      }
      if (aktifSohbet === id) {
        setMesajlar([]);
        setAktifSohbet(null);
      }
    } catch (hata) {
      console.error('sohbet silinemedi', hata);
    }
  };

  // mesaj metnini panoya kopyala
  const metinKopyala = (id, metin) => {
    navigator.clipboard.writeText(metin);
    setKopyalandiId(id);
    setTimeout(() => setKopyalandiId(null), 2000);
  };

  // son mesajı yeniden üret
  const yenidenUret = () => {
    const sonKullaniciMesaji = [...mesajlar].reverse().find(m => m.tip === 'kullanici');
    if (sonKullaniciMesaji) {
      mesajGonder(sonKullaniciMesaji.icerik);
    }
  };

  // sohbeti markdown raporu olarak indir
  const sohbetiIndir = () => {
    if (mesajlar.length === 0) return;
    let md = `# Salus AI Siber Güvenlik İstihbarat Raporu\n`;
    md += `Tarih: ${new Date().toLocaleString('tr-TR')}\n\n---\n\n`;
    mesajlar.forEach(m => {
      const baslik = m.tip === 'kullanici' ? '### 👤 Kullanıcı' : '### 🛡️ Salus AI Asistan';
      md += `${baslik} (${m.zaman})\n\n${m.icerik}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `salus_ai_sohbet_raporu_${Date.now()}.md`;
    link.click();
  };

  // filtrelenmiş geçmiş
  const filtrelenmisSohbetler = sohbetler.filter(s =>
    s.baslik.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  return (
    <div className="sohbet-sayfa">
      {/* mobil geçmiş arka perdesi */}
      <div
        className={`sohbet-gecmis-arka ${gecmisAcik ? 'acik' : ''}`}
        onClick={() => setGecmisAcik(false)}
      />

      {/* sol geçmiş kenar çubuğu */}
      <aside className={`sohbet-gecmis ${gecmisAcik ? 'acik' : ''}`}>
        <div className="sohbet-gecmis-baslik">
          <div className="sohbet-gecmis-baslik-sol">
            <MessageSquare size={18} style={{ color: '#38bdf8' }} />
            <h3>Sohbet Geçmişi</h3>
          </div>
          <button
            className="buton buton-birincil"
            onClick={yeniSohbet}
            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={14} /> Yeni
          </button>
        </div>

        {/* arama çubuğu */}
        <div className="sohbet-gecmis-arama">
          <div className="sohbet-arama-kutu">
            <Search size={14} style={{ color: 'var(--metin-soluk)' }} />
            <input
              type="text"
              className="sohbet-arama-girdi"
              placeholder="Sohbetlerde ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
            />
          </div>
        </div>

        {/* geçmiş listesi */}
        <div className="sohbet-gecmis-liste">
          {filtrelenmisSohbetler.length === 0 ? (
            <div className="sohbet-gecmis-bos">
              {aramaMetni ? 'Eşleşen sohbet bulunamadı.' : 'Henüz geçmiş sohbet yok.'}
            </div>
          ) : (
            filtrelenmisSohbetler.map((sohbet) => (
              <div
                key={sohbet.id}
                className={`sohbet-gecmis-oge ${aktifSohbet === sohbet.id ? 'aktif' : ''}`}
                onClick={() => {
                  setAktifSohbet(sohbet.id);
                  setGecmisAcik(false);
                  const oturumMesajlari = tamGecmis
                    .filter(g => g.oturum_id === sohbet.id)
                    .sort((a, b) => new Date(a.olusturulma_tarihi) - new Date(b.olusturulma_tarihi));
                  const formatliMesajlar = [];
                  oturumMesajlari.forEach(secilen => {
                    const zaman = new Date(secilen.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    formatliMesajlar.push({ id: `k-${secilen.id}`, tip: 'kullanici', icerik: secilen.mesaj, zaman });
                    formatliMesajlar.push({ id: `a-${secilen.id}`, tip: 'ai', icerik: secilen.yanit, zaman });
                  });
                  setMesajlar(formatliMesajlar);
                }}
              >
                <MessageSquare size={15} style={{ flexShrink: 0 }} />
                <div className="sohbet-gecmis-oge-icerik">
                  <span className="sohbet-gecmis-oge-metin">{sohbet.baslik}</span>
                  <span className="sohbet-gecmis-oge-tarih">{sohbet.tarih}</span>
                </div>
                <button
                  className="sohbet-gecmis-oge-sil"
                  onClick={(e) => sohbetSilIsle(e, sohbet.id)}
                  title="Sohbeti Sil"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ana sohbet alanı */}
      <main className="sohbet-ana">
        {/* üst kontrol çubuğu */}
        <div className="sohbet-ust-bar">
          <div className="sohbet-ust-sol">
            <button
              className="sohbet-gecmis-tetik"
              onClick={() => setGecmisAcik(!gecmisAcik)}
              aria-label="Geçmiş Menüsü"
            >
              {gecmisAcik ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="sohbet-model-rozet">
              <span className="sohbet-model-nokta" />
              SALUS AI CYBER INTEL v2.0
            </div>
          </div>

          <div className="sohbet-ust-sag">
            {mesajlar.length > 0 && (
              <>
                <button
                  className="sohbet-aksiyon-buton"
                  onClick={sohbetiIndir}
                  title="Sohbeti Markdown Olarak İndir"
                >
                  <Download size={14} /> Dışa Aktar
                </button>
                <button
                  className="sohbet-aksiyon-buton"
                  onClick={() => setMesajlar([])}
                  title="Görünümü Temizle"
                >
                  <Trash2 size={14} /> Temizle
                </button>
              </>
            )}
          </div>
        </div>

        {/* mesajlar veya başlangıç ekranı */}
        {mesajlar.length === 0 ? (
          <div className="sohbet-bos">
            <div className="sohbet-bos-ikon-kapsayici">
              <div className="sohbet-bos-halka" />
              <div className="sohbet-bos-ikon">
                <Shield size={28} />
              </div>
            </div>

            <h2>Salus AI <span className="gradyan-metin">Siber Güvenlik Asistanı</span></h2>
            <p>
              Yapay zeka ve uzman siber analiz modülleriyle güçlendirilmiş güvenlik istihbaratı. Zafiyet taraması, kriptografi, ağ savunması veya log analizi hakkında hemen danışın.
            </p>

            {/* kategori filtreleri */}
            <div className="sohbet-kategoriler">
              {SOHBET_KATEGORILERI.map(kat => (
                <button
                  key={kat.id}
                  className={`sohbet-kategori-sekme ${kategoriSecili === kat.id ? 'aktif' : ''}`}
                  onClick={() => setKategoriSecili(kat.id)}
                >
                  <kat.ikon size={14} />
                  {kat.etiket}
                </button>
              ))}
            </div>

            {/* seçili kategoriye ait hazır prompt kartları */}
            <div className="sohbet-oneriler-grid">
              {SOHBET_KATEGORILERI.find(k => k.id === kategoriSecili)?.oneriler.map((oneri, idx) => (
                <button
                  key={idx}
                  className="sohbet-oneri-kart"
                  onClick={() => mesajGonder(oneri.komut)}
                >
                  <Sparkles size={16} className="oneri-ikon" />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--metin)' }}>
                      {oneri.baslik}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)', lineHeight: 1.4 }}>
                      {oneri.aciklama}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={mesajlarAlaniRef}
            className="sohbet-mesajlar"
            onScroll={kaydirmaKontrol}
          >
            {mesajlar.map((mesaj) => (
              <div
                key={mesaj.id}
                className={`mesaj-kapsayici ${mesaj.tip === 'kullanici' ? 'kullanici' : 'ai'}`}
              >
                <div className="mesaj-satir">
                  <div className="mesaj-avatar">
                    {mesaj.tip === 'kullanici' ? basHarf : <Bot size={18} />}
                  </div>

                  <div className="mesaj-balon">
                    {mesaj.tip === 'ai' ? (
                      <div className="markdown-govde">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const dil = match ? match[1] : '';
                              const kodMetni = String(children).replace(/\n$/, '');

                              if (!inline && match) {
                                return (
                                  <div className="kod-blok-kapsayici">
                                    <div className="kod-blok-baslik">
                                      <span>{dil}</span>
                                      <button
                                        className="kod-kopyala-buton"
                                        onClick={() => metinKopyala(`code-${mesaj.id}`, kodMetni)}
                                      >
                                        {kopyalandiId === `code-${mesaj.id}` ? (
                                          <><Check size={12} style={{ color: 'var(--basari)' }} /> Kopyalandı</>
                                        ) : (
                                          <><Copy size={12} /> Kodu Kopyala</>
                                        )}
                                      </button>
                                    </div>
                                    <pre className="kod-blok-icerik">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                );
                              }
                              return (
                                <code className={className} style={{ background: 'var(--yuzey-acik)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-kod)', fontSize: '0.84rem' }} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {mesaj.icerik}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{mesaj.icerik}</div>
                    )}
                  </div>
                </div>

                {/* alt bilgi ve aksiyonlar */}
                <div className="mesaj-alt-satir">
                  <span className="mesaj-zaman">{mesaj.zaman}</span>
                  {mesaj.tip === 'ai' && (
                    <>
                      <button
                        className="mesaj-aksiyon-buton"
                        onClick={() => metinKopyala(mesaj.id, mesaj.icerik)}
                        title="Yanıtı Kopyala"
                      >
                        {kopyalandiId === mesaj.id ? (
                          <><Check size={12} style={{ color: 'var(--basari)' }} /> Kopyalandı</>
                        ) : (
                          <><Copy size={12} /> Kopyala</>
                        )}
                      </button>
                      <button
                        className="mesaj-aksiyon-buton"
                        onClick={yenidenUret}
                        title="Yeniden Yanıt Al"
                      >
                        <RotateCcw size={12} /> Yeniden Üret
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* yazıyor animasyonu */}
            {yukleniyor && (
              <div className="mesaj-kapsayici ai">
                <div className="mesaj-satir">
                  <div className="mesaj-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="mesaj-balon">
                    <div className="yaziyor-kapsayici">
                      <span className="yaziyor-metin">Siber istihbarat analiz ediliyor</span>
                      <div className="yaziyor-noktalar">
                        <span className="yaziyor-nokta" />
                        <span className="yaziyor-nokta" />
                        <span className="yaziyor-nokta" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={mesajlarSonuRef} />
          </div>
        )}

        {/* yüzen aşağı kaydır butonu */}
        {asagiKaydirGoster && (
          <button
            className="asagi-kaydir-buton"
            onClick={() => asagiKaydir(true)}
          >
            <ChevronDown size={14} /> Yeni Mesajlar
          </button>
        )}

        {/* hızlı siber komutlar çubuğu */}
        <div className="hizli-komutlar-bar">
          {HIZLI_KOMUTLAR.map((hk, idx) => (
            <button
              key={idx}
              className="hizli-komut-cip"
              onClick={() => mesajGonder(hk.metin)}
              disabled={yukleniyor}
            >
              {hk.etiket}
            </button>
          ))}
        </div>

        {/* mesaj giriş kutusu */}
        <div className="sohbet-giris-alan">
          <div className="sohbet-giris-kapsayici">
            <textarea
              ref={girisRef}
              className="sohbet-giris"
              placeholder="Siber güvenlik sorunuzu yazın... (Örn: 8.8.8.8 IP'sini veya SQLi zaafiyetini analiz et)"
              value={giris}
              onChange={(e) => setGiris(e.target.value)}
              onKeyDown={tusKontrol}
              rows={1}
              disabled={yukleniyor}
            />
            <div className="sohbet-giris-alt-bilgi">
              <button
                className="sohbet-gonder-buton"
                onClick={() => mesajGonder()}
                disabled={!giris.trim() || yukleniyor}
                aria-label="Mesajı Gönder"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiSohbet;
