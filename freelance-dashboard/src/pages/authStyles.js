export const authPageCss = `
  .auth-root {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 40px 24px;
    background:
      linear-gradient(135deg, rgba(28,15,7,0.04), transparent 35%),
      #f6f1e8;
    font-family: var(--font-sans);
  }

  .auth-shell {
    width: min(100%, 1080px);
    min-height: 640px;
    display: grid;
    grid-template-columns: minmax(320px, 0.92fr) minmax(420px, 1fr);
    background: #fffbf5;
    border: 1px solid rgba(92,61,35,0.14);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 28px 80px rgba(28,15,7,0.13);
  }

  .auth-story {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 42px;
    background: #1d140d;
    color: #fffaf2;
    overflow: hidden;
  }
  .auth-story::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 16% 18%, rgba(218,174,83,0.16), transparent 28%),
      radial-gradient(circle at 82% 76%, rgba(128,83,48,0.38), transparent 34%),
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: auto, auto, 44px 44px, 44px 44px;
    pointer-events: none;
  }

  .auth-brand,
  .auth-story-main,
  .auth-proof {
    position: relative;
    z-index: 1;
  }

  .auth-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .auth-brand-mark {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #d9ac4f;
    color: #1d140d;
    font-weight: 800;
    letter-spacing: 0;
  }
  .auth-brand-name {
    font-size: 15px;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .auth-story-title {
    max-width: 390px;
    margin: 0 0 16px;
    font-family: var(--font-serif);
    font-size: 52px;
    font-weight: 400;
    line-height: 0.98;
    letter-spacing: 0;
  }
  .auth-story-title span {
    color: #d9ac4f;
    font-style: italic;
  }
  .auth-story-copy {
    max-width: 355px;
    color: rgba(255,250,242,0.62);
    font-size: 15px;
    line-height: 1.65;
  }

  .auth-proof {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .auth-proof-item {
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
  }
  .auth-proof-value {
    display: block;
    color: #d9ac4f;
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .auth-proof-label {
    display: block;
    color: rgba(255,250,242,0.48);
    font-size: 11px;
    line-height: 1.35;
  }

  .auth-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 56px;
    background: #fffbf5;
  }
  .auth-form-card {
    width: min(100%, 390px);
  }
  .auth-eyebrow {
    margin: 0 0 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #a97b22;
  }
  .auth-title {
    margin: 0 0 10px;
    color: #1d140d;
    font-family: var(--font-serif);
    font-size: 38px;
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: 0;
  }
  .auth-sub {
    margin: 0 0 30px;
    color: #775f4c;
    font-size: 14px;
    line-height: 1.55;
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  .auth-field label {
    color: #3b2a1e;
    font-size: 12px;
    font-weight: 650;
  }
  .auth-field input {
    width: 100%;
    height: 46px;
    border: 1px solid #d8c9b9;
    border-radius: 8px;
    background: #fffdf9;
    color: #1d140d;
    font: inherit;
    font-size: 14px;
    padding: 0 14px;
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }
  .auth-field input::placeholder {
    color: #ad9d8d;
  }
  .auth-field input:hover {
    border-color: #c5ad94;
  }
  .auth-field input:focus {
    border-color: #c79129;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(199,145,41,0.14);
  }
  .auth-help {
    margin: -8px 0 18px;
    color: #8b7664;
    font-size: 12px;
  }

  .auth-alert,
  .auth-success {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
  }
  .auth-alert {
    background: #fff1ee;
    border: 1px solid #f0c5bd;
    color: #9b2c20;
  }
  .auth-success {
    background: #eef8f1;
    border: 1px solid #c6e6d0;
    color: #205c38;
  }

  .auth-btn {
    width: 100%;
    height: 48px;
    border: 0;
    border-radius: 8px;
    background: #1d140d;
    color: #fffaf2;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 120ms ease, background 160ms ease, opacity 160ms ease;
  }
  .auth-btn:hover:not(:disabled) {
    background: #302014;
  }
  .auth-btn:active:not(:disabled) {
    transform: translateY(1px);
  }
  .auth-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .auth-switch {
    margin: 22px 0 0;
    text-align: center;
    color: #775f4c;
    font-size: 13px;
  }
  .auth-switch a {
    color: #1d140d;
    font-weight: 750;
    text-decoration: none;
    border-bottom: 1px solid #d9ac4f;
  }
  .auth-switch a:hover {
    color: #a97b22;
  }

  @media (max-width: 860px) {
    .auth-root {
      padding: 0;
      place-items: stretch;
    }
    .auth-shell {
      width: 100%;
      min-height: 100dvh;
      grid-template-columns: 1fr;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .auth-story {
      min-height: 260px;
      padding: 30px 24px;
      gap: 34px;
    }
    .auth-story-title {
      font-size: 36px;
      max-width: 330px;
    }
    .auth-proof {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .auth-panel {
      align-items: flex-start;
      padding: 34px 24px 48px;
    }
    .auth-title {
      font-size: 32px;
    }
  }

  @media (max-width: 520px) {
    .auth-proof {
      display: none;
    }
    .auth-story {
      min-height: 220px;
    }
  }
`

export const styles = {
  container: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    padding: 32,
    background: '#f6f1e8',
    fontFamily: 'var(--font-sans)',
  },
  card: {
    width: 'min(100%, 420px)',
    background: '#fffbf5',
    border: '1px solid rgba(92,61,35,0.14)',
    borderRadius: 8,
    padding: 34,
    boxShadow: '0 24px 70px rgba(28,15,7,0.1)',
  },
  title: {
    margin: '0 0 10px',
    color: '#1d140d',
    fontFamily: 'var(--font-serif)',
    fontSize: 38,
    fontWeight: 400,
    lineHeight: 1.05,
  },
  subtitle: {
    margin: '0 0 26px',
    color: '#775f4c',
    fontSize: 14,
    lineHeight: 1.55,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: '#3b2a1e',
    fontSize: 12,
    fontWeight: 650,
  },
  input: {
    width: '100%',
    height: 46,
    border: '1px solid #d8c9b9',
    borderRadius: 8,
    background: '#fffdf9',
    color: '#1d140d',
    font: 'inherit',
    fontSize: 14,
    padding: '0 14px',
    outline: 'none',
  },
  button: {
    width: '100%',
    height: 48,
    border: 0,
    borderRadius: 8,
    background: '#1d140d',
    color: '#fffaf2',
    font: 'inherit',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    margin: '0 0 16px',
    padding: '12px 14px',
    borderRadius: 8,
    background: '#fff1ee',
    border: '1px solid #f0c5bd',
    color: '#9b2c20',
    fontSize: 13,
    lineHeight: 1.45,
  },
  link: {
    color: '#1d140d',
    fontWeight: 750,
    textDecoration: 'none',
    borderBottom: '1px solid #d9ac4f',
  },
  footerText: {
    margin: '22px 0 0',
    textAlign: 'center',
    color: '#775f4c',
    fontSize: 13,
  },
}
