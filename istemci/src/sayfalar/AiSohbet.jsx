import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  Trash2,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { aiMesajGonder, aiGecmisGetir, sohbetSil } from '../servisler/apiServisi';
import './AiSohbet.css';

const AiSohbet = () => {
  const { kullanici } = useYetkilendirme();
  const [mesajlar, setMesajlar] = useState([]);
  const [giris, setGiris] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(false);
  const [sohbetler, setSohbetler] = useState([]);
  const [tamGecmis, setTamGecmis] = useState([]);
  const [aktifSohbet, setAktifSohbet] = useState(null);
  const mesajlarSonuRef = useRef(null);
  const girisRef = useRef(null);

  // geçmiş yükleme
  useEffect(() => {
    const gecmisiYukle = async () => {
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
                baslik: g.mesaj.length > 30 ? g.mesaj.substring(0, 30) + '...' : g.mesaj,
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
    };
    gecmisiYukle();
  }, []);

  // kullanıcı baş harfi
  const basHarf = kullanici?.tam_ad
    ? kullanici.tam_ad.charAt(0).toUpperCase()
    : 'K';

  // zaman formatla
  const zamanFormatla = () => {
    const simdi = new Date();
    return simdi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // mesaj gönder
  const mesajGonder = async (metin = null) => {
    const mesajMetni = metin || giris.trim();
    if (!mesajMetni || yukleniyor) return;

    const kullaniciMesaji = {
      id: Date.now(),
      tip: 'kullanici',
      icerik: mesajMetni,
      zaman: zamanFormatla(),
    };

    setMesajlar((onceki) => [...onceki, kullaniciMesaji]);
    setGiris('');
    setYukleniyor(true);

    try {
      const yanit = await aiMesajGonder(mesajMetni, aktifSohbet);
      const yeniOturumId = yanit?.veri?.oturum_id;
      
      const aiMesaji = {
        id: Date.now() + 1,
        tip: 'ai',
        icerik: yanit?.veri?.yanit || yanit.mesaj || yanit.yanit || yanit.response || 'Yanıt alınamadı.',
        zaman: zamanFormatla(),
      };
      setMesajlar((onceki) => [...onceki, aiMesaji]);
      
      if (yanit.veri) {
        setTamGecmis(onceki => [yanit.veri, ...onceki]);
        setSohbetler(onceki => {
          const varSohbet = onceki.find(s => s.id === yeniOturumId);
          if (varSohbet) {
            const guncelSohbet = { ...varSohbet, olusturulma_tarihi: yanit.veri.olusturulma_tarihi };
            return [guncelSohbet, ...onceki.filter(s => s.id !== yeniOturumId)];
          } else {
            return [{
              id: yeniOturumId,
              baslik: yanit.veri.mesaj.length > 30 ? yanit.veri.mesaj.substring(0, 30) + '...' : yanit.veri.mesaj,
              tarih: new Date(yanit.veri.olusturulma_tarihi).toLocaleDateString('tr-TR'),
              olusturulma_tarihi: yanit.veri.olusturulma_tarihi
            }, ...onceki];
          }
        });
        if (!aktifSohbet) {
          setAktifSohbet(yeniOturumId);
        }
      }
    } catch (hata) {
      // hata durumunda demo yanıt göster
      const demoYanitlar = [
        `Siber güvenlik sorunuz alındı. "${mesajMetni}" konusunda size yardımcı olabilirim.\n\nSiber güvenlik, bilgi sistemlerini yetkisiz erişim, kullanım, ifşa, bozulma, değiştirme veya imhadan koruma uygulamasıdır.\n\nDaha spesifik sorular sormaktan çekinmeyin!`,
        `Bu konuda detaylı bilgi verebilirim.\n\n**Önemli noktalar:**\n- Güçlü parolalar kullanın\n- İki faktörlü doğrulama aktif edin\n- Düzenli güvenlik güncellemeleri yapın\n- Güvenlik duvarı kurallarını gözden geçirin\n\nBaşka sorularınız varsa sormaktan çekinmeyin.`,
        `Harika bir soru! Siber güvenlikte bu konu çok önemlidir.\n\n\`\`\`\n// örnek güvenlik kontrolü\nconst guvenlikKontrolu = (giris) => {\n  const temizlenmis = sanitize(giris);\n  return dogrula(temizlenmis);\n};\n\`\`\`\n\nBu yaklaşım XSS saldırılarına karşı koruma sağlar.`,
      ];
      const rastgeleYanit = demoYanitlar[Math.floor(Math.random() * demoYanitlar.length)];
      const aiMesaji = {
        id: Date.now() + 1,
        tip: 'ai',
        icerik: rastgeleYanit,
        zaman: zamanFormatla(),
      };
      setMesajlar((onceki) => [...onceki, aiMesaji]);
    } finally {
      setYukleniyor(false);
    }
  };

  // tuş kontrolü (enter ile gönder)
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
  };

  // sohbet sil
  const sohbetSilIsle = async (e, id) => {
    e.stopPropagation();
    try {
      await sohbetSil(id);
      setSohbetler((onceki) => onceki.filter((s) => s.id !== id));
      setTamGecmis((onceki) => onceki.filter((s) => s.id !== id));
      if (aktifSohbet === id) {
        setMesajlar([]);
        setAktifSohbet(null);
      }
    } catch (hata) {
      console.error('sohbet silinemedi', hata);
    }
  };

  // öneriler
  const oneriler = [
    'SQL Injection saldırısı nedir ve nasıl korunulur?',
    'Ağ güvenliği için en iyi uygulamalar nelerdir?',
    'XSS açığı nasıl tespit edilir?',
    'Güvenli parola politikası nasıl oluşturulur?',
  ];

  return (
    <div className="sohbet-sayfa">
      {/* mobil geçmiş arkaplanı */}
      <div
        className={`sohbet-gecmis-arka ${gecmisAcik ? 'acik' : ''}`}
        onClick={() => setGecmisAcik(false)}
      />

      {/* sohbet geçmişi kenar çubuğu */}
      <aside className={`sohbet-gecmis ${gecmisAcik ? 'acik' : ''}`}>
        <div className="sohbet-gecmis-baslik">
          <h3>Sohbet Geçmişi</h3>
          <button className="buton buton-birincil yeni-sohbet-buton" onClick={yeniSohbet}>
            <Plus size={14} /> Yeni
          </button>
        </div>
        <div className="sohbet-gecmis-liste">
          {sohbetler.map((sohbet) => (
            <div
              key={sohbet.id}
              className={`sohbet-gecmis-oge ${aktifSohbet === sohbet.id ? 'aktif' : ''}`}
              onClick={() => {
                setAktifSohbet(sohbet.id);
                setGecmisAcik(false);
                const oturumMesajlari = tamGecmis.filter(g => g.oturum_id === sohbet.id).sort((a, b) => new Date(a.olusturulma_tarihi) - new Date(b.olusturulma_tarihi));
                const formatliMesajlar = [];
                oturumMesajlari.forEach(secilen => {
                  const zaman = new Date(secilen.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  formatliMesajlar.push({ id: `k-${secilen.id}`, tip: 'kullanici', icerik: secilen.mesaj, zaman });
                  formatliMesajlar.push({ id: `a-${secilen.id}`, tip: 'ai', icerik: secilen.yanit, zaman });
                });
                setMesajlar(formatliMesajlar);
              }}
            >
              <MessageSquare size={16} />
              <span className="sohbet-gecmis-oge-metin">{sohbet.baslik}</span>
              <button
                className="sohbet-gecmis-oge-sil"
                onClick={(e) => sohbetSilIsle(e, sohbet.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ana sohbet alanı */}
      <main className="sohbet-ana">
        {/* mobil geçmiş tetik */}
        <button
          className={`sohbet-gecmis-tetik ${gecmisAcik ? 'acik' : ''}`}
          onClick={() => setGecmisAcik(!gecmisAcik)}
        >
          {gecmisAcik ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* mesajlar veya boş durum */}
        {mesajlar.length === 0 ? (
          <div className="sohbet-bos">
            <div className="sohbet-bos-ikon">
              <Shield size={36} />
            </div>
            <h2>Salus AI <span className="gradyan-metin">Asistan</span></h2>
            <p>
              Siber güvenlik hakkında soru sorun. Tehdit analizi, ağ güvenliği,
              güvenlik açıkları ve daha fazlası hakkında bilgi alın.
            </p>
            <div className="sohbet-oneriler">
              {oneriler.map((oneri, i) => (
                <button
                  key={i}
                  className="sohbet-oneri"
                  onClick={() => mesajGonder(oneri)}
                >
                  {oneri}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="sohbet-mesajlar">
            {mesajlar.map((mesaj) => (
              <div key={mesaj.id} className={`mesaj ${mesaj.tip === 'kullanici' ? 'kullanici' : 'ai'}`}>
                <div className="mesaj-avatar">
                  {mesaj.tip === 'kullanici' ? basHarf : <Bot size={18} />}
                </div>
                <div>
                  <div className="mesaj-icerik">
                    {mesaj.tip === 'ai' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {mesaj.icerik}
                      </ReactMarkdown>
                    ) : (
                      mesaj.icerik
                    )}
                  </div>
                  <div className="mesaj-zaman">{mesaj.zaman}</div>
                </div>
              </div>
            ))}

            {/* yazıyor animasyonu */}
            {yukleniyor && (
              <div className="mesaj ai">
                <div className="mesaj-avatar">
                  <Bot size={18} />
                </div>
                <div className="mesaj-icerik">
                  <div className="yaziyor">
                    <span className="yaziyor-nokta" />
                    <span className="yaziyor-nokta" />
                    <span className="yaziyor-nokta" />
                  </div>
                </div>
              </div>
            )}

            <div ref={mesajlarSonuRef} />
          </div>
        )}

        {/* mesaj giriş alanı */}
        <div className="sohbet-giris-alan">
          <div className="sohbet-giris-kapsayici">
            <textarea
              ref={girisRef}
              className="sohbet-giris"
              placeholder="Siber güvenlik hakkında soru sorun..."
              value={giris}
              onChange={(e) => setGiris(e.target.value)}
              onKeyDown={tusKontrol}
              rows={1}
            />
            <button
              className="sohbet-gonder-buton"
              onClick={() => mesajGonder()}
              disabled={!giris.trim() || yukleniyor}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiSohbet;
