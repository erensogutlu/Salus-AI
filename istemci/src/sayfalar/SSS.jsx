import React from 'react';
import './Profil.css'; // stil için profil css'ini kullanıyoruz

const SSS = () => {
  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>Sıkça Sorulan Sorular</h1>
        <p>Bu sayfa yapım aşamasındadır.</p>
      </div>
      <div className="profil-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="cam-kart profil-sag-kart">
          <section className="profil-form-bolumu">
            <h3>Sıkça Sorulan Sorular İçeriği</h3>
            <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.6' }}>
              Çok yakında burada sıkça sorulan sorular ile ilgili detaylı içerikler yer alacaktır. 
              Lütfen daha sonra tekrar ziyaret edin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SSS;
