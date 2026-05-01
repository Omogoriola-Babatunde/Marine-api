import { escapeHtml } from "../../utils/validation.js";

const formatMoney = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const renderHtml = (policy, quote) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; height: 297mm; }

  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: antialiased;
  }

  .page { position: relative; width: 210mm; height: 297mm; padding: 0; overflow: hidden; }

  /* Watermark */
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-28deg);
    font-size: 92px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #0f766e;
    opacity: 0.06;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }

  /* Top brand band — flat color */
  .header {
    background: #0f766e;
    color: #ecfdf5;
    padding: 14mm 18mm 12mm;
    position: relative;
    z-index: 1;
  }

  .header-row {
    display: flex; justify-content: space-between; align-items: flex-start;
  }

  .brand { display: flex; align-items: center; gap: 3mm; }
  .brand .mark {
    width: 11mm; height: 11mm;
    border: 1.5px solid rgba(255,255,255,0.6);
    border-radius: 2.5mm;
    display: flex; align-items: center; justify-content: center;
  }
  .brand .mark svg { width: 7mm; height: 7mm; }
  .brand .name { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  .brand .tag { font-size: 9px; opacity: 0.75; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 0.5mm; }

  .pol-meta { text-align: right; font-size: 9px; opacity: 0.85; }
  .pol-meta .label { letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.7; margin-bottom: 1mm; }
  .pol-meta .num {
    font-family: "JetBrains Mono", "SF Mono", "Menlo", monospace;
    font-size: 11px;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .title-block { margin-top: 14mm; }
  h1 {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin-bottom: 2mm;
  }
  .title-block .sub {
    font-size: 12px;
    opacity: 0.85;
    letter-spacing: 0.03em;
  }

  /* Body */
  .body { padding: 14mm 18mm 0; position: relative; z-index: 1; }

  .section-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 3mm;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6mm;
    margin-bottom: 7mm;
  }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 3mm;
    padding: 5mm 6mm;
    background: #ffffff;
  }
  .card .hd {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #0f766e;
    margin-bottom: 3mm;
  }
  .field { margin-bottom: 3mm; }
  .field:last-child { margin-bottom: 0; }
  .field .k { font-size: 9.5px; color: #64748b; margin-bottom: 0.8mm; letter-spacing: 0.04em; }
  .field .v { font-size: 13px; color: #0f172a; font-weight: 500; }
  .field .v.mono {
    font-family: "JetBrains Mono", "SF Mono", monospace;
    font-size: 10.5px;
    font-weight: 400;
  }

  /* Voyage card */
  .voyage {
    border: 1px solid #e2e8f0;
    border-radius: 3mm;
    padding: 5mm 6mm;
    margin-bottom: 7mm;
    background: #ffffff;
  }
  .voyage .hd { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #0f766e; margin-bottom: 4mm; }
  .voyage-flow {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 4mm;
  }
  .voyage-flow .port .k { font-size: 8.5px; color: #64748b; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 1mm; }
  .voyage-flow .port .v { font-size: 14px; font-weight: 600; }
  .voyage-flow .port.right { text-align: right; }
  .voyage-flow .arrow {
    display: flex; flex-direction: column; align-items: center; gap: 1mm;
    color: #0f766e;
  }
  .voyage-flow .arrow .line {
    width: 30mm; height: 1px; background: #0f766e;
    position: relative;
  }
  .voyage-flow .arrow .line::after {
    content: ""; position: absolute; right: 0; top: -1mm;
    border-left: 1.5mm solid #0f766e;
    border-top: 1mm solid transparent;
    border-bottom: 1mm solid transparent;
  }
  .voyage-flow .arrow .cargo { font-size: 9px; color: #64748b; letter-spacing: 0.05em; }

  /* Coverage hero — flat color */
  .coverage {
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    border-radius: 3mm;
    padding: 6mm;
    margin-bottom: 7mm;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 6mm;
    align-items: end;
  }
  .coverage .left .k { font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #0f766e; margin-bottom: 1.5mm; }
  .coverage .left .v {
    font-size: 36px; font-weight: 700; letter-spacing: -0.03em;
    color: #0f172a; line-height: 1;
  }
  .coverage .left .currency { font-size: 16px; color: #64748b; font-weight: 500; margin-left: 1.5mm; }
  .coverage .right { text-align: right; padding-bottom: 1mm; }
  .coverage .right .k { font-size: 9px; color: #64748b; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 1.5mm; }
  .coverage .right .v { font-size: 18px; font-weight: 600; color: #0f172a; }

  .terms {
    font-size: 9.5px;
    line-height: 1.55;
    color: #475569;
    padding: 4mm 0;
    border-top: 1px solid #e2e8f0;
  }
  .terms strong { color: #0f172a; font-weight: 600; }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 6mm 18mm;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 6mm;
    align-items: center;
    z-index: 1;
  }
  .footer .meta { font-size: 9px; color: #64748b; }
  .footer .meta .label { letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.5mm; opacity: 0.85; }
  .footer .meta .val {
    font-family: "JetBrains Mono", "SF Mono", monospace;
    font-size: 10px; color: #0f172a; font-weight: 500;
  }
  .footer .meta.right { text-align: right; }
  .footer .qr {
    width: 18mm; height: 18mm;
    border: 1px solid #cbd5e1;
    border-radius: 1.5mm;
    background:
      linear-gradient(45deg, #0f172a 25%, transparent 25%, transparent 75%, #0f172a 75%),
      linear-gradient(45deg, #0f172a 25%, transparent 25%, transparent 75%, #0f172a 75%),
      #ffffff;
    background-size: 2.5mm 2.5mm;
    background-position: 0 0, 1.25mm 1.25mm;
    position: relative;
  }
  .footer .qr::after {
    content: "";
    position: absolute; inset: 4mm;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 0.5mm;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="watermark">MARINE INSURANCE</div>

    <div class="header">
      <div class="header-row">
        <div class="brand">
          <div class="mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 4 L16 28 M9 10 L23 10 M6 18 Q16 24 26 18 Q22 28 16 28 Q10 28 6 18 Z"
                    stroke="#ecfdf5" stroke-width="1.8" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="name">Marine Insurance</div>
            <div class="tag">Cargo Coverage</div>
          </div>
        </div>
        <div class="pol-meta">
          <div class="label">Policy Number</div>
          <div class="num">${escapeHtml(policy.policyNumber)}</div>
        </div>
      </div>

      <div class="title-block">
        <h1>Certificate of Insurance</h1>
        <div class="sub">Marine Cargo &middot; Single voyage &middot; All-risk basis</div>
      </div>
    </div>

    <div class="body">
      <div class="section-label">Parties</div>
      <div class="grid-2">
        <div class="card">
          <div class="hd">Insured</div>
          <div class="field">
            <div class="k">Customer name</div>
            <div class="v">${escapeHtml(policy.customername)}</div>
          </div>
          <div class="field">
            <div class="k">Quote reference</div>
            <div class="v mono">${escapeHtml(policy.quoteId)}</div>
          </div>
        </div>
        <div class="card">
          <div class="hd">Issued by</div>
          <div class="field">
            <div class="k">Underwriter</div>
            <div class="v">Marine Insurance Co.</div>
          </div>
          <div class="field">
            <div class="k">Issue date</div>
            <div class="v">${formatDate(new Date())}</div>
          </div>
        </div>
      </div>

      <div class="section-label">Voyage</div>
      <div class="voyage">
        <div class="hd">Conveyance</div>
        <div class="voyage-flow">
          <div class="port">
            <div class="k">From</div>
            <div class="v">${escapeHtml(quote.origin)}</div>
          </div>
          <div class="arrow">
            <div class="cargo">${escapeHtml(quote.cargoType)}</div>
            <div class="line"></div>
          </div>
          <div class="port right">
            <div class="k">To</div>
            <div class="v">${escapeHtml(quote.destination)}</div>
          </div>
        </div>
      </div>

      <div class="section-label">Coverage</div>
      <div class="coverage">
        <div class="left">
          <div class="k">Insured value</div>
          <div class="v">${formatMoney(quote.cargoValue)}<span class="currency">USD</span></div>
        </div>
        <div class="right">
          <div class="k">Premium</div>
          <div class="v">${formatMoney(quote.premium)}</div>
        </div>
      </div>

      <div class="terms">
        <strong>Coverage scope.</strong> This certificate confirms the cargo described above is insured under the terms and conditions of the Marine Cargo Insurance policy, covering loss of or damage to the cargo during transit between the ports named, subject to the exclusions of the underlying contract. Verify authenticity at the QR code below.
      </div>
    </div>

    <div class="footer">
      <div class="meta">
        <div class="label">Certificate ID</div>
        <div class="val">${escapeHtml(policy.id)}</div>
      </div>
      <div class="qr"></div>
      <div class="meta right">
        <div class="label">Issued</div>
        <div class="val">${formatDate(new Date())}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
