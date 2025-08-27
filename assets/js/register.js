// assets/js/register.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const statusEl = document.getElementById('status');

  // Never auto-submit on load; only react to manual submit:
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Read fields
    const name  = (form.name.value || '').trim();
    const state = form.state.value || '';
    const lga   = form.lga.value || '';
    const ward  = (form.ward.value || '').trim();
    const ninRaw = (form.nin.value || '').replace(/\D/g, '');
    const passportFile = form.passport.files[0];

    // Basic checks
    if (ninRaw.length !== 11) {
      alert('NIN must be exactly 11 digits.');
      return;
    }
    if (!passportFile) {
      alert('Please upload a passport photo.');
      return;
    }

    const uniqueId = `2353${ninRaw.slice(-4)}`;
    statusEl.textContent = 'Registration Successful! Generating ID…';

    try {
      // Prepare assets
      const [watermark, passport, barcode] = await Promise.all([
        // Turn your Chairman.jpg into a faint page watermark
        makeWatermark('images/Chairman.jpg', 0.12).catch(() => null),
        fileToDataURL(passportFile).catch(() => null),
        Promise.resolve(makeBarcode(uniqueId)),
      ]);

      // Create A4 doc
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Background watermark across the whole A4
      if (watermark) {
        doc.addImage(watermark, 'JPEG', 0, 0, pageW, pageH);
      }

      // --- ID Card layout (credit-card size) centered on A4 ---
      const cardW = 86;     // mm
      const cardH = 54;     // mm
      const x = (pageW - cardW) / 2;
      const y = 30;

      // Card outline
      doc.setDrawColor(30, 90, 60);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

      // Header band
      doc.setFillColor(43, 61, 52); // dark green
      doc.rect(x, y, cardW, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('HON. ISYAKU BAWA NA’ABI 2025', x + 4, y + 8);

      // Passport area
      if (passport) {
        // draw image 24x30mm
        doc.addImage(passport, 'JPEG', x + 4, y + 16, 24, 30);
      } else {
        // placeholder box if somehow missing
        doc.setDrawColor(180);
        doc.rect(x + 4, y + 16, 24, 30);
      }

      // Details box at right of photo
      const dx = x + 32, dy = y + 16, dw = cardW - 36, dh = 30;
      doc.setDrawColor(220);
      doc.rect(dx, dy, dw, dh);

      // Labels
      doc.setTextColor(60);
      doc.setFontSize(8);
      doc.text('NAME',        dx + 2, dy + 5);
      doc.text('STATE / LGA', dx + 2, dy + 15);
      doc.text('WARD',        dx + 2, dy + 25);

      // Values
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(name,          dx + 2, dy + 10);
      doc.text(`${state} / ${lga}`, dx + 2, dy + 20);
      doc.text(ward,          dx + 2, dy + 30);

      // Unique ID badge
      doc.setFillColor(255, 215, 0); // gold
      doc.roundedRect(x + cardW - 36, y + 14, 32, 10, 2, 2, 'F');
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`ID: ${uniqueId}`, x + cardW - 34, y + 21);

      // Barcode along bottom of card
      if (barcode) {
        doc.addImage(barcode, 'PNG', x + 10, y + cardH - 16, cardW - 20, 12);
        doc.setFontSize(8);
        doc.setTextColor(50);
        doc.text(uniqueId, x + cardW / 2, y + cardH - 2, { align: 'center' });
      }

      // Cut marks around card for easy trimming
      doc.setDrawColor(150);
      const cm = 5;
      // top-left
      doc.line(x, y - cm, x, y);
      doc.line(x - cm, y, x, y);
      // top-right
      doc.line(x + cardW, y - cm, x + cardW, y);
      doc.line(x + cardW, y, x + cardW + cm, y);
      // bottom-left
      doc.line(x, y + cardH, x, y + cardH + cm);
      doc.line(x - cm, y + cardH, x, y + cardH);
      // bottom-right
      doc.line(x + cardW, y + cardH, x + cardW + cm, y + cardH);
      doc.line(x + cardW, y + cardH, x + cardW, y + cardH + cm);

      // Title above the card
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text('CAMPAIGN SUPPORTER ID CARD', pageW / 2, y - 8, { align: 'center' });

      // Save file
      const safeName = name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
      doc.save(`${safeName}_${uniqueId}.pdf`);

      statusEl.textContent = 'ID downloaded. Please print on A4 and cut along the marks.';
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Sorry, could not generate the ID. See console for details.';
    }
  });
});

/* ---------- helpers ---------- */

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Draws an image to a canvas at reduced alpha, then returns a dataURL.
// If it fails to load (e.g., path issue), it resolves null so PDF still generates.
function makeWatermark(src, alpha = 0.12) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = src; // same-origin path: images/Chairman.jpg
  });
}

// Generate a Code-128 barcode as a dataURL using JsBarcode
function makeBarcode(text) {
  const canvas = document.createElement('canvas');
  // Display value is false; we print the text separately for cleaner look
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, margin: 0, width: 2, height: 40 });
  return canvas.toDataURL('image/png');
}
