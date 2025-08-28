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

  // Retrieve & increment serial from localStorage
  let lastSerial = localStorage.getItem("lastAPCSerial") || "0";
  lastSerial = (parseInt(lastSerial) + 1).toString().padStart(3, "0");
  localStorage.setItem("lastAPCSerial", lastSerial);
  const serialNumber = `APC-2025-${lastSerial}`;

  // Mask NIN to last 4 digits
  const maskedNIN = nin ? `**** **** ${nin.slice(-4)}` : "";

  const reader = new FileReader();
  reader.onload = async function (event) {
    const passportDataURL = event.target.result;

    // Generate barcode using FULL NIN
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, nin, {
      format: 'CODE128',
      displayValue: true,
      width: 2,
      height: 50,
      margin: 5
    });

    // Load watermark image
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
      frontCanvas.width = cardWidth * 2;
      frontCanvas.height = cardHeight * 2;
      const fctx = frontCanvas.getContext('2d');
      fctx.scale(2, 2);

      // Background watermark + white overlay
      fctx.drawImage(chairmanImage, 0, 0, cardWidth, cardHeight);
      fctx.fillStyle = "rgba(255,255,255,0.92)";
      fctx.fillRect(0, 0, cardWidth, cardHeight);

      // Outline border (Royal Green)
      fctx.strokeStyle = "#007a33";
      fctx.lineWidth = 4;
      fctx.strokeRect(2, 2, cardWidth - 4, cardHeight - 4);

      // Caption at Top
      fctx.fillStyle = "#007a33";
      fctx.font = "bold 14pt Arial";
      fctx.textAlign = "center";
      fctx.fillText("SULEJA APC MEMBERSHIP CARD", cardWidth / 2, 25);

      // Passport Image
      const passportImg = new Image();
      passportImg.src = passportDataURL;
      passportImg.onload = function () {
        fctx.drawImage(passportImg, 10, 40, 70, 80);

        // Helper for multi-line text
        const fitText = (ctx, text, maxWidth, font, startY, lineHeight = 14) => {
          ctx.font = font;
          ctx.textAlign = "left";
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

        // Member Details
        fctx.fillStyle = "#000";
        fitText(fctx, name, 200, "bold 12pt Arial", 70);
        fctx.font = "10pt Arial";
        fctx.fillText(`State: ${state}`, 90, 110);
        fctx.fillText(`LGA: ${lga}`, 90, 130);
        fctx.fillText(`Ward: ${ward}`, 90, 150);
        fctx.fillText(`NIN: ${maskedNIN}`, 10, 175);
        fctx.fillText(`ID: ${serialNumber}`, 200, 175);

        // Add FRONT to PDF
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", marginX, 50, cardWidth, cardHeight);

        // ---------------- BACK OF ID ----------------
        const backCanvas = document.createElement('canvas');
        backCanvas.width = cardWidth * 2;
        backCanvas.height = cardHeight * 2;
        const bctx = backCanvas.getContext('2d');
        bctx.scale(2, 2);

        bctx.fillStyle = "#fff";
        bctx.fillRect(0, 0, cardWidth, cardHeight);

        // Back Caption
        bctx.fillStyle = "#007a33";
        bctx.font = "bold 12pt Arial";
        bctx.textAlign = "center";
        bctx.fillText("OFFICIAL APC MEMBER ID", cardWidth / 2, 30);

        // Disclaimer text (centered top)
        bctx.fillStyle = "#000";
        bctx.font = "8pt Arial";
        bctx.textAlign = "center";
        bctx.fillText("Always verify credentials presented.", cardWidth / 2, 55);
        bctx.fillText("Ensure front details match verification results.", cardWidth / 2, 70);

        // Barcode at bottom
        bctx.drawImage(barcodeCanvas, 30, cardHeight - 70, 240, 50);

        // Add BACK to PDF (below front)
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", marginX, 300, cardWidth, cardHeight);

        // Save PDF
        pdf.save(`${serialNumber}_${name}_ID.pdf`);
        status.textContent = `ID Card Generated! Serial: ${serialNumber}`;
      };
    };
  };
  reader.readAsDataURL(passportFile);
});
