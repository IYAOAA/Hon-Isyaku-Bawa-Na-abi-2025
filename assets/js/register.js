document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const status = document.getElementById('status');
  status.textContent = "Registration Successful! Generating ID…";

  const formData = new FormData(this);
  const name = formData.get('name');
  const state = formData.get('state');
  const lga = formData.get('lga');
  const ward = formData.get('ward');
  const nin = formData.get('nin');
  const passportFile = formData.get('passport');

  if (!passportFile) {
    status.textContent = "Passport photo is required!";
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const passportDataURL = event.target.result;

    // Generate barcode
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, nin, {
      format: 'CODE128',
      displayValue: true,
      width: 2,
      height: 50,
      margin: 10
    });

    // Load Chairman watermark
    const chairmanImage = new Image();
    chairmanImage.src = 'images/Chairman.jpg';
    chairmanImage.crossOrigin = "Anonymous";

    chairmanImage.onload = function () {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const marginX = 100;
      const cardWidth = 300;
      const cardHeight = 190;

      // ---------------- FRONT OF ID ----------------
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = cardWidth * 2; // Higher resolution
      frontCanvas.height = cardHeight * 2;
      const fctx = frontCanvas.getContext('2d');
      fctx.scale(2, 2);

      // Background with watermark
      fctx.drawImage(chairmanImage, 0, 0, cardWidth, cardHeight);
      fctx.fillStyle = "rgba(255,255,255,0.9)";
      fctx.fillRect(0, 0, cardWidth, cardHeight);

      // Caption
      fctx.fillStyle = "#007a33";
      fctx.font = "bold 14pt Arial";
      fctx.fillText("SULEJA APC MEMBERSHIP CARD", 20, 20);

      // Passport
      const passportImg = new Image();
      passportImg.src = passportDataURL;
      passportImg.onload = function () {
        fctx.drawImage(passportImg, 10, 40, 70, 80);

        // Fit text dynamically
        const fitText = (ctx, text, maxWidth, font, startY, lineHeight = 14) => {
          ctx.font = font;
          let words = text.split(" ");
          let line = "";
          let y = startY;
          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + " ";
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
              ctx.fillText(line, 90, y);
              line = words[n] + " ";
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 90, y);
        };

        fctx.fillStyle = "#000";
        fitText(fctx, name, 200, "bold 12pt Arial", 70);
        fctx.font = "10pt Arial";
        fctx.fillText(`State: ${state}`, 90, 110);
        fctx.fillText(`LGA: ${lga}`, 90, 130);
        fctx.fillText(`Ward: ${ward}`, 90, 150);
        fctx.fillText(`NIN: ${nin}`, 10, 175);

        // Add FRONT to PDF (top)
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", marginX, 50, cardWidth, cardHeight);

        // ---------------- BACK OF ID ----------------
        const backCanvas = document.createElement('canvas');
        backCanvas.width = cardWidth * 2;
        backCanvas.height = cardHeight * 2;
        const bctx = backCanvas.getContext('2d');
        bctx.scale(2, 2);

        bctx.fillStyle = "#fff";
        bctx.fillRect(0, 0, cardWidth, cardHeight);

        // Barcode
        bctx.drawImage(barcodeCanvas, 30, 30, 240, 60);

        // Disclaimer
        bctx.fillStyle = "#000";
        bctx.font = "8pt Arial";
        bctx.fillText("Always verify the credentials whenever this ID is presented,", 10, 120);
        bctx.fillText("ensuring the details on the front of the card perfectly", 10, 135);
        bctx.fillText("match the verification results.", 10, 150);

        // Add BACK to PDF (below)
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", marginX, 300, cardWidth, cardHeight);

        // Save PDF
        pdf.save(`${name}_ID.pdf`);
        status.textContent = "ID Card Generated & Downloaded!";
      };
    };
  };
  reader.readAsDataURL(passportFile);
});
