import React from 'react';

const YuklemeSpinner = ({ boyut = 'normal', metin = 'Yükleniyor...', tamSayfa = false }) => {
  // Sadeleştirilmiş boyutlar
  const piksel = boyut === 'kucuk' ? 20 : boyut === 'buyuk' ? 36 : 28;

  return (
    <div
      className="yukleyici-kapsayici"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: tamSayfa ? '70vh' : boyut === 'buyuk' ? '40vh' : '160px',
        padding: '24px',
        gap: '12px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <div
        className="yukleyici"
        style={{
          width: `${piksel}px`,
          height: `${piksel}px`,
          borderWidth: piksel > 28 ? '2.5px' : '2px',
        }}
      />
      {metin && (
        <span
          style={{
            color: 'var(--metin-soluk)',
            fontSize: boyut === 'buyuk' ? '0.88rem' : '0.82rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          {metin}
        </span>
      )}
    </div>
  );
};

export default YuklemeSpinner;
