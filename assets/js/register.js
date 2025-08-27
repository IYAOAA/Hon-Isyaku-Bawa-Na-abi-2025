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

  // Read passport image
  const reader = new FileReader();
  reader.onload = async function (event) {
    const passportDataURL = event.target.result;

    // Prepare canvas for barcode
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, nin, {
      format: 'CODE128',
      displayValue: true,
      width: 2,
      height: 50,
      margin: 10
    });

    // Load Chairman.jpg as watermark for front
    const chairmanImage = new Image();
    chairmanImage.src = 'images/Chairman.jpg';
    chairmanImage.crossOrigin = "Anonymous";

    chairmanImage.onload = function () {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const marginX = 40;
      const cardWidth = 250;
      const cardHeight = 160;

      // ------------------ FRONT OF ID CARD ------------------
      const frontCanvas = document.createElement('canvas');
      frontCanvas.width = cardWidth;
      frontCanvas.height = cardHeight;
      const fctx = frontCanvas.getContext('2d');

      // Background with Chairman.jpg watermark
      fctx.drawImage(chairmanImage, 0, 0, cardWidth, cardHeight);
      fctx.fillStyle = "rgba(255,255,255,0.85)";
      fctx.fillRect(0, 0, cardWidth, cardHeight);

      // Passport photo
      const passportImg = new Image();
      passportImg.src = passportDataURL;
      passportImg.onload = function () {
        fctx.drawImage(passportImg, 10, 10, 60, 70);

        fctx.fillStyle = "#000";
        fctx.font = "bold 12pt Arial";
        fctx.fillText(name, 80, 30);
        fctx.font = "10pt Arial";
        fctx.fillText(`State: ${state}`, 80, 50);
        fctx.fillText(`LGA: ${lga}`, 80, 70);
        fctx.fillText(`Ward: ${ward}`, 80, 90);
        fctx.fillText(`NIN: ${nin}`, 10, 140);

        // Add front card to PDF
        pdf.text("FRONT", marginX, 30);
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", marginX, 50, cardWidth, cardHeight);

        // ------------------ BACK OF ID CARD ------------------
        const backCanvas = document.createElement('canvas');
        backCanvas.width = cardWidth;
        backCanvas.height = cardHeight;
        const bctx = backCanvas.getContext('2d');

        // White background
        bctx.fillStyle = "#fff";
        bctx.fillRect(0, 0, cardWidth, cardHeight);

        // Disclaimer
        bctx.fillStyle = "#000";
        bctx.font = "8pt Arial";
        bctx.fillText("Always verify the credentials whenever this ID is presented,", 10, 110);
        bctx.fillText("ensuring the details on the front of the card perfectly", 10, 125);
        bctx.fillText("match the verification results.", 10, 140);

         // Barcode
        bctx.drawImage(barcodeCanvas, 20, 20, 200, 60);

        // Add back card to PDF
        pdf.text("BACK", marginX + cardWidth + 60, 30);
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", marginX + cardWidth + 60, 50, cardWidth, cardHeight);

        // Save PDF
        pdf.save(`${name}_ID.pdf`);
        status.textContent = "ID Card Generated & Downloaded!";
      };
    };
  };
  reader.readAsDataURL(passportFile);
});
