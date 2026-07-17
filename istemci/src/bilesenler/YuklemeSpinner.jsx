import { Shield } from 'lucide-react';

const YuklemeSpinner = ({ boyut = 'normal', metin = 'Yükleniyor...' }) => {
  const spinnerBoyut = boyut === 'kucuk' ? 32 : boyut === 'buyuk' ? 64 : 48;

  return (
    <div className="yukleyici-kapsayici" style={{ flexDirection: 'column', gap: '16px', minHeight: boyut === 'buyuk' ? '60vh' : 'auto' }}>
      <div style={{
        position: 'relative',
        width: `${spinnerBoyut + 20}px`,
        height: `${spinnerBoyut + 20}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* dönen dış halka */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '3px solid var(--sinir)',
          borderTopColor: 'var(--birincil)',
          borderRightColor: 'var(--ikincil)',
          borderRadius: '50%',
          animation: 'dondur 1s linear infinite',
        }} />
        {/* kalkan ikonu */}
        <Shield
          size={spinnerBoyut * 0.5}
          style={{
            color: 'var(--birincil)',
            animation: 'nabiz 2s ease-in-out infinite',
          }}
        />
      </div>
      {metin && (
        <span style={{
          color: 'var(--metin-soluk)',
          fontSize: '0.9rem',
          fontWeight: 500,
        }}>
          {metin}
        </span>
      )}
    </div>
  );
};

export default YuklemeSpinner;
