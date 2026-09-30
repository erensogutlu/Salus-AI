import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import './Profil.css';

const SSS = () => {
  const [acikIndex, setAcikIndex] = useState(0);

  const sorular = [
    {
      soru: 'Salus AI nedir ve nasıl çalışır?',
      cevap: 'Salus AI, yapay zeka modelleri ve otomatik tarama altyapısı kullanarak web siteleri, IP adresleri ve ağlar üzerindeki potansiyel siber güvenlik açıklarını, açık portları ve zararlı kalıpları tespit eden gelişmiş bir güvenlik analiz platformudur.'
    },
    {
      soru: 'Tarama ve analizler sistemlerime zarar verir mi?',
      cevap: 'Hayır. Salus AI analiz motoru pasif istihbarat (OSINT) ve standart ağ keşif istekleri kullanır. Sistemlerinize zarar verici aktif sömürü (exploitation) gerçekleştirmez.'
    },
    {
      soru: 'AI Asistan hangi konularda yardımcı olabilir?',
      cevap: 'AI Güvenlik Asistanımız; kod güvenliği denetimi, güvenlik duvarı kuralları optimizasyonu, CVE zafiyet analizleri, güvenli şifreleme ve siber saldırı kalıpları hakkında detaylı rehberlik sunar.'
    },
    {
      soru: 'Verilerim güvende mi?',
      cevap: 'Evet. Tüm sorgular ve analiz geçmişi şifrelenmiş veritabanında saklanır. Bilgileriniz asla üçüncü taraflarla paylaşılmaz.'
    }
  ];

  return (
    <div className="profil-sayfa" style={{ maxWidth: '860px' }}>
      <div className="profil-baslik">
        <h1>
          Sıkça Sorulan <span className="gradyan-metin">Sorular</span>
        </h1>
        <p>Salus AI platformu hakkında en çok merak edilen konular ve cevapları.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sorular.map((s, idx) => {
          const acik = acikIndex === idx;
          return (
            <div key={idx} className="cam-kart" style={{ overflow: 'hidden', transition: 'all 0.25s' }}>
              <button
                onClick={() => setAcikIndex(acik ? null : idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--metin)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit'
                }}
              >
                <span>{s.soru}</span>
                <ChevronDown size={18} style={{ transform: acik ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', color: 'var(--birincil)' }} />
              </button>
              {acik && (
                <div style={{ padding: '0 24px 20px', color: 'var(--metin-soluk)', fontSize: '0.94rem', lineHeight: '1.65' }}>
                  {s.cevap}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SSS;
