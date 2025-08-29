document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const status = document.getElementById('status');
  status.textContent = "Processing registration…";

  const formData = new FormData(this);
  const name = formData.get('name');
  const state = formData.get('state');
  const lga = formData.get('lga');
  const ward = formData.get('ward');
  const nin = formData.get('nin');
  const dob = formData.get('dob');
  const passportFile = formData.get('passport');
  const docFile = formData.get('document');

  // ===== Validation =====
  if (!passportFile) {
    status.textContent = "Passport photo is required!";
    return;
  }

  if (passportFile.type.startsWith("image/") && passportFile.size > 100 * 1024) {
    status.textContent = "Passport photo must be ≤ 100KB!";
    return;
  }

  if (docFile && docFile.type === "application/pdf" && docFile.size > 500 * 1024) {
    status.textContent = "Uploaded PDF must be ≤ 500KB!";
    return;
  }

  // Prevent duplicate NIN
  let usedNINs = JSON.parse(localStorage.getItem("usedAPCNINs") || "[]");
  if (usedNINs.includes(nin)) {
    status.textContent = "This NIN has already been registered!";
    return;
  }
  usedNINs.push(nin);
  localStorage.setItem("usedAPCNINs", JSON.stringify(usedNINs));

  // ===== Generate Serial =====
  let lastSerial = localStorage.getItem("lastAPCSerial") || "0";
  lastSerial = (parseInt(lastSerial) + 1).toString().padStart(3, "0");
  localStorage.setItem("lastAPCSerial", lastSerial);
  const serialNumber = `APC-2025-${lastSerial}`;

  // Mask NIN
  const maskedNIN = nin ? `**** **** ${nin.slice(-4)}` : "";

  const reader = new FileReader();
  reader.onload = async function (event) {
    const passportDataURL = event.target.result;

    // Generate barcode with SERIAL instead of NIN
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, serialNumber, {
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

      // ---------------- FRONT ----------------
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = cardWidth * 2;
      frontCanvas.height = cardHeight * 2;
      const fctx = frontCanvas.getContext('2d');
      fctx.scale(2, 2);

      // Watermark + white overlay
      fctx.drawImage(chairmanImage, 0, 0, cardWidth, cardHeight);
      fctx.fillStyle = "rgba(255,255,255,0.92)";
      fctx.fillRect(0, 0, cardWidth, cardHeight);

      // Border
      fctx.strokeStyle = "#007a33";
      fctx.lineWidth = 4;
      fctx.strokeRect(2, 2, cardWidth - 4, cardHeight - 4);

      // Caption
      fctx.fillStyle = "#007a33";
      fctx.font = "bold 12pt Arial";
      fctx.textAlign = "center";
      fctx.fillText("SULEJA APC MEMBERSHIP CARD", cardWidth / 2, 25);

      // Passport
      const passportImg = new Image();
      passportImg.src = passportDataURL;
      passportImg.onload = function () {
        fctx.drawImage(passportImg, 10, 40, 70, 80);

        // Multi-line helper
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

        // Member details
        fctx.fillStyle = "#000";
        fitText(fctx, name, 200, "bold 12pt Arial", 70);
        fctx.font = "10pt Arial";
        fctx.fillText(`State: ${state}`, 90, 110);
        fctx.fillText(`LGA: ${lga}`, 90, 125);
        fctx.fillText(`Ward: ${ward}`, 90, 140);
        fctx.fillText(`DOB: ${dob}`, 90, 155);
        fctx.fillText(`NIN: ${maskedNIN}`, 10, 175);
        fctx.fillText(`ID: ${serialNumber}`, 200, 175);

        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", marginX, 50, cardWidth, cardHeight);

        // ---------------- BACK ----------------
        const backCanvas = document.createElement('canvas');
        backCanvas.width = cardWidth * 2;
        backCanvas.height = cardHeight * 2;
        const bctx = backCanvas.getContext('2d');
        bctx.scale(2, 2);

        bctx.fillStyle = "#fff";
        bctx.fillRect(0, 0, cardWidth, cardHeight);

        // Caption
        bctx.fillStyle = "#007a33";
        bctx.font = "bold 12pt Arial";
        bctx.textAlign = "center";
        bctx.fillText("OFFICIAL APC MEMBER ID", cardWidth / 2, 30);

        // Disclaimer
        bctx.fillStyle = "#000";
        bctx.font = "8pt Arial";
        bctx.fillText("Always verify credentials whenever this ID is presented.", cardWidth / 2, 55);
        bctx.fillText("Ensure details on front match verification results.", cardWidth / 2, 70);

        // Barcode (serial-based)
        bctx.drawImage(barcodeCanvas, 30, cardHeight - 70, 240, 50);

        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", marginX, 300, cardWidth, cardHeight);

        // Save
        pdf.save(`${serialNumber}_${name}_ID.pdf`);
        status.textContent = `Registration successful! ID: ${serialNumber}`;
      };
    };
  };
  reader.readAsDataURL(passportFile);
});
