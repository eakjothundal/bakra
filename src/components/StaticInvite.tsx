export function StaticInvite() {
  return (
    <div
      id="static-invite"
      style={{
        position: 'absolute',
        left: -99999,
        top: 0,
        width: 1080,
        height: 1920,
        background: '#F4E8D0',
        color: '#1a1410',
        padding: 90,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
      aria-hidden
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: 12,
          color: '#8B3A1F',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        ★ You're Invited ★
      </div>

      <div
        style={{
          marginTop: 40,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: '#D4A017',
          border: '10px solid #8B3A1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        <span style={{ fontSize: 340, lineHeight: 1 }}>🐐</span>
      </div>

      <h1
        style={{
          marginTop: 50,
          fontFamily: 'Rye, serif',
          fontSize: 150,
          lineHeight: 0.9,
          color: '#1a1410',
          textAlign: 'center',
          textShadow: '8px 8px 0 #8B3A1F',
        }}
      >
        BAKRA
        <br />
        PARTY
      </h1>

      <div
        style={{
          marginTop: 60,
          width: '100%',
          borderTop: '4px dashed #8B3A1F',
          paddingTop: 40,
          textAlign: 'center',
        }}
      >
        <Row label="WHEN" value="TUE · MAY 19, 2026 · 6 PM" />
        <Row label="WHERE" value="2177 DONOVAN DR, LINCOLN CA" />
        <Row label="FIT" value="YOUR GOAT'S JERSEY — ANY SPORT" />
      </div>

      <div
        style={{
          marginTop: 'auto',
          fontSize: 30,
          letterSpacing: 6,
          color: '#8B3A1F',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        eakjot.dev/bakra
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 24,
          letterSpacing: 8,
          color: '#8B3A1F',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 700,
          color: '#1a1410',
          letterSpacing: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
