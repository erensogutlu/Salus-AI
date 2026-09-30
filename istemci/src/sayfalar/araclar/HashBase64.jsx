import { useState, useEffect } from 'react';
import {
  Code,
  Link as LinkIcon,
  FileCode,
  Fingerprint,
  Cpu,
  Copy,
  Check,
  ArrowDownUp,
  Trash2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';

const HashBase64 = () => {
  const [aktifSekme, setAktifSekme] = useState('base64');
  const [girdi, setGirdi] = useState('');
  const [cikti, setCikti] = useState('');
  const [islemModu, setIslemModu] = useState('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [htmlModu, setHtmlModu] = useState('named');
  
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [aiSonuc, setAiSonuc] = useState('');
  const [hata, setHata] = useState('');
  const [kopyalandi, setKopyalandi] = useState(false);

  // istemci dönüşüm işlemi
  const anlikDonustur = (metin = girdi, mod = islemModu, sekme = aktifSekme) => {
    if (!metin) {
      setCikti('');
      return;
    }
    try {
      if (sekme === 'base64') {
        if (mod === 'encode') {
          // base64 kodlama
          const utf8Bytes = new TextEncoder().encode(metin);
          let binary = '';
          for (let i = 0; i < utf8Bytes.length; i++) {
            binary += String.fromCharCode(utf8Bytes[i]);
          }
          let res = btoa(binary);
          if (urlSafe) {
            res = res.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          }
          setCikti(res);
        } else {
          // base64 çözme
          let b64 = metin.trim().replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          setCikti(new TextDecoder().decode(bytes));
        }
      } else if (sekme === 'url') {
        if (mod === 'encode') {
          setCikti(encodeURIComponent(metin));
        } else {
          setCikti(decodeURIComponent(metin.replace(/\+/g, ' ')));
        }
      } else if (sekme === 'html') {
        if (mod === 'encode') {
          if (htmlModu === 'named') {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            setCikti(metin.replace(/[&<>"']/g, (m) => map[m]));
          } else if (htmlModu === 'decimal') {
            setCikti(metin.split('').map((c) => (c.charCodeAt(0) > 127 || '<>&"\''.includes(c) ? `&#${c.charCodeAt(0)};` : c)).join(''));
          } else if (htmlModu === 'hex') {
            setCikti(metin.split('').map((c) => (c.charCodeAt(0) > 127 || '<>&"\''.includes(c) ? `&#x${c.charCodeAt(0).toString(16).toUpperCase()};` : c)).join(''));
          }
        } else {
          // html entity çözme
          const txt = document.createElement('textarea');
          txt.innerHTML = metin;
          setCikti(txt.value);
        }
      }
    } catch (e) {
      setCikti(`[Dönüştürme Hatası: Geçersiz format veya bozuk girdi]`);
    }
  };

  // anlık dönüştürme
  useEffect(() => {
    if (aktifSekme !== 'hash') {
      anlikDonustur(girdi, islemModu, aktifSekme);
    }
  }, [girdi, islemModu, aktifSekme, urlSafe, htmlModu]);

  // yapay zeka analizi
  const aiAnalizBaslat = async () => {
    if (!girdi.trim()) return;
    setAiYukleniyor(true);
    setHata('');
    setAiSonuc('');

    try {
      let komut = '';
      if (aktifSekme === 'hash') {
        komut = girdi.trim();
        const yanit = await aracCagir('hashTanimlayici', komut);
        if (yanit.basarili) setAiSonuc(yanit.sonuc);
        else setHata(yanit.mesaj || 'İşlem başarısız.');
      } else {
        const islemKelimesi = islemModu === 'decode' ? 'çöz' : 'kodla';
        komut = `${aktifSekme} ${islemKelimesi} ${girdi.trim()}`;
        const yanit = await aracCagir('base64Araci', komut);
        if (yanit.basarili) setAiSonuc(yanit.sonuc);
        else setHata(yanit.mesaj || 'İşlem başarısız.');
      }
    } catch (err) {
      setHata(err.message || 'Sunucu ile bağlantı kurulamadı.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  const panoyaKopyala = (metin) => {
    if (!metin) return;
    navigator.clipboard.writeText(metin);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  const yerDegistir = () => {
    if (!cikti || cikti.startsWith('[')) return;
    setGirdi(cikti);
    setIslemModu(islemModu === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="tehdit-sayfa">
      <div className="tehdit-sayfa-baslik">
        <h1>
          <span className="gradyan-metin">Encoding & Decoding</span> Stüdyosu
        </h1>
        <p>Base64, URL (Percent-Encoding), HTML Entity ve Hash formatlarını dönüştürün; çözümlenen içerikleri siber saldırı (XSS, SQLi, RCE) imzalarına karşı tarayın.</p>
      </div>

      {/* sekmeler */}
      <div className="sonuc-sekmeler" style={{ marginBottom: '20px', background: 'transparent', padding: 0 }}>
        <button
          className={`sekme-buton ${aktifSekme === 'base64' ? 'aktif' : ''}`}
          onClick={() => { setAktifSekme('base64'); setAiSonuc(''); setHata(''); }}
        >
          <Code size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Base64
        </button>
        <button
          className={`sekme-buton ${aktifSekme === 'url' ? 'aktif' : ''}`}
          onClick={() => { setAktifSekme('url'); setAiSonuc(''); setHata(''); }}
        >
          <LinkIcon size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          URL Encode
        </button>
        <button
          className={`sekme-buton ${aktifSekme === 'html' ? 'aktif' : ''}`}
          onClick={() => { setAktifSekme('html'); setAiSonuc(''); setHata(''); }}
        >
          <FileCode size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          HTML Entity
        </button>
        <button
          className={`sekme-buton ${aktifSekme === 'hash' ? 'aktif' : ''}`}
          onClick={() => { setAktifSekme('hash'); setAiSonuc(''); setHata(''); }}
        >
          <Fingerprint size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Hash Tanımlayıcı
        </button>
      </div>

      {/* ana çevirici kartı */}
      <div className="analiz-form-kart">
        {aktifSekme !== 'hash' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            {/* işlem modu */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--yuzey-acik)', padding: '3px', borderRadius: 'var(--yuvarlatma-kucuk)', border: '1px solid var(--sinir)' }}>
              <button
                type="button"
                className={`buton buton-kucuk ${islemModu === 'encode' ? 'buton-birincil' : 'buton-hayalet'}`}
                onClick={() => setIslemModu('encode')}
                style={{ padding: '4px 14px', fontSize: '0.82rem' }}
              >
                Kodla (Encode)
              </button>
              <button
                type="button"
                className={`buton buton-kucuk ${islemModu === 'decode' ? 'buton-birincil' : 'buton-hayalet'}`}
                onClick={() => setIslemModu('decode')}
                style={{ padding: '4px 14px', fontSize: '0.82rem' }}
              >
                Çöz (Decode)
              </button>
            </div>

            {/* alt seçenekler */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {aktifSekme === 'base64' && (
                <label style={{ fontSize: '0.82rem', color: 'var(--metin-soluk)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={urlSafe}
                    onChange={(e) => setUrlSafe(e.target.checked)}
                    style={{ accentColor: 'var(--birincil)', cursor: 'pointer' }}
                  />
                  URL-Safe Modu
                </label>
              )}

              {aktifSekme === 'html' && islemModu === 'encode' && (
                <select
                  className="form-girisi"
                  value={htmlModu}
                  onChange={(e) => setHtmlModu(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '0.8rem', height: 'auto', width: 'auto' }}
                >
                  <option value="named">Named Entities (&amp;lt;, &amp;gt;)</option>
                  <option value="decimal">Numeric Decimal (&amp;#60;)</option>
                  <option value="hex">Hexadecimal (&amp;#x3C;)</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* metin alanları */}
        <div style={{ display: 'grid', gridTemplateColumns: aktifSekme === 'hash' ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {/* girdi alanı */}
          <div className="form-grubu">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-etiketi" style={{ margin: 0 }}>
                {aktifSekme === 'hash' ? 'Bilinmeyen Hash Değeri' : islemModu === 'encode' ? 'Ham Metin (Input)' : 'Kodlanmış Metin (Encoded Input)'}
              </label>
              {girdi && (
                <button
                  type="button"
                  onClick={() => setGirdi('')}
                  style={{ background: 'none', border: 'none', color: 'var(--metin-cok-soluk)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={12} /> Temizle
                </button>
              )}
            </div>
            <textarea
              className="form-girisi"
              rows={6}
              placeholder={
                aktifSekme === 'hash' ? 'Örn: 5f4dcc3b5aa765d61d8327deb882cf99' :
                aktifSekme === 'base64' ? (islemModu === 'encode' ? 'Kodlanacak metni yazın...' : 'aGVsbG8gd29ybGQ=') :
                aktifSekme === 'url' ? (islemModu === 'encode' ? 'https://example.com/arama?q=salus ai' : 'https%3A%2F%2Fexample.com') :
                (islemModu === 'encode' ? '<script>alert("XSS")</script>' : '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
              }
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              style={{ fontFamily: 'var(--font-kod)', fontSize: '0.84rem' }}
            />
          </div>

          {/* çıktı alanı */}
          {aktifSekme !== 'hash' && (
            <div className="form-grubu">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-etiketi" style={{ margin: 0 }}>
                  {islemModu === 'encode' ? 'Kodlanmış Çıktı (Output)' : 'Çözülen Metin (Decoded Output)'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={yerDegistir}
                    disabled={!cikti}
                    style={{ background: 'none', border: 'none', color: 'var(--birincil)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Çıktıyı girdiye aktar ve modu değiştir"
                  >
                    <ArrowDownUp size={12} /> Yer Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={() => panoyaKopyala(cikti)}
                    disabled={!cikti}
                    style={{ background: 'none', border: 'none', color: 'var(--metin-soluk)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {kopyalandi ? <><Check size={12} style={{ color: 'var(--basari)' }} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                  </button>
                </div>
              </div>
              <textarea
                className="form-girisi"
                rows={6}
                readOnly
                value={cikti}
                placeholder="Dönüştürülen sonuç burada anında görünür..."
                style={{ fontFamily: 'var(--font-kod)', fontSize: '0.84rem', background: 'var(--yuzey-acik)' }}
              />
            </div>
          )}
        </div>

        {/* aksiyon çubuğu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)' }}>Hızlı Örnekler:</span>
            {(aktifSekme === 'base64'
              ? ['Salus AI Siber Güvenlik', 'eyJhZG1pbiI6dHJ1ZX0=']
              : aktifSekme === 'url'
              ? ['https://site.com/?s=test 123', 'admin%20%27%20OR%201%3D1--']
              : aktifSekme === 'html'
              ? ['<img src=x onerror=alert(1)>', '&quot;Hello &amp; World&quot;']
              : ['5f4dcc3b5aa765d61d8327deb882cf99', '2ef7bde608ce5404e97d5f042f95f89f1c232871']
            ).map((ornek, idx) => (
              <button
                key={idx}
                type="button"
                className="buton buton-hayalet buton-kucuk"
                onClick={() => setGirdi(ornek)}
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
              >
                Örnek {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="buton buton-birincil"
            onClick={aiAnalizBaslat}
            disabled={aiYukleniyor || !girdi.trim()}
            style={{ fontSize: '0.84rem', padding: '6px 16px' }}
          >
            {aiYukleniyor ? (
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> Taranıyor...</>
            ) : (
              <><Sparkles size={16} /> {aktifSekme === 'hash' ? 'Algoritmayı Tanımla (AI)' : 'Saldırı Payload Taraması (AI)'}</>
            )}
          </button>
        </div>
      </div>

      {hata && (
        <div className="bildirim bildirim-hata" style={{ position: 'relative', top: 0, right: 0, marginBottom: '20px', maxWidth: '100%' }}>
          {hata}
        </div>
      )}

      {/* yapay zeka yükleme durumu */}
      {aiYukleniyor && (
        <div className="analiz-sonuc">
          <div className="tarama-animasyon">
            <div className="tarama-ilerleme-bar">
              <div className="tarama-ilerleme-cizgi" style={{ width: '80%', animation: 'nabiz 1.5s infinite' }} />
            </div>
            <div className="tarama-mesaj">
              <strong>Yapay zeka güvenlik motoru</strong> kalıpları analiz ediyor...
            </div>
          </div>
        </div>
      )}

      {/* yapay zeka analiz sonucu */}
      {aiSonuc && !aiYukleniyor && (
        <div className="analiz-sonuc" style={{ padding: '20px' }}>
          <div className="analiz-sonuc-baslik" style={{ margin: '-20px -20px 20px -20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} style={{ color: 'var(--birincil)' }} />
              <h3>Güvenlik & Algoritma Raporu</h3>
            </div>
            <span className="rozet rozet-bilgi">Tamamlandı</span>
          </div>
          <div className="analiz-sonuc-govde markdown-icerik" style={{ padding: 0, minHeight: 'auto' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiSonuc}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default HashBase64;
