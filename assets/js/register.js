document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const statusDiv = document.getElementById('status');
    statusDiv.style.color = 'green';
    statusDiv.innerText = 'Registration Successful! Generating ID...';

    const name = this.name.value;
    const nin = this.nin.value;
    const lga = this.lga.value;
    const ward = this.ward.value;

    const passportFile = document.getElementById('passport').files[0];
    const passportBase64 = await fileToBase64(passportFile);

    // Load Chairman background
    const chairmanImg = await loadImage('images/Chairman.jpg');

    // Create Barcode as Base64
    const barcodeCanvas = document.createElement('canvas');
    bwipjs.toCanvas(barcodeCanvas, {
        bcid: 'code128',
        text: nin,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
    });
    const barcodeBase64 = barcodeCanvas.toDataURL('image/png');

    // Generate PDF (A4)
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Draw background full page
    pdf.addImage(chairmanImg, 'JPEG', 0, 0, pageWidth, pageHeight);

    // ID Card Container on A4 (Centered)
    const cardX = 35, cardY = 50, cardW = 140, cardH = 85;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'F');

    // Header Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 102, 204);
    pdf.text('Hon-Isyaku-Bawa-Na-abi-2025', pageWidth / 2, cardY + 10, { align: 'center' });

    // Passport Image on Card
    if (passportBase64) pdf.addImage(passportBase64, 'JPEG', cardX + 5, cardY + 20, 30, 30);

    // Details on Card
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Name: ${name}`, cardX + 45, cardY + 25);
    pdf.text(`NIN: ${nin}`, cardX + 45, cardY + 35);
    pdf.text(`LGA: ${lga}`, cardX + 45, cardY + 45);
    pdf.text(`Ward: ${ward}`, cardX + 45, cardY + 55);

    // Barcode
    pdf.addImage(barcodeBase64, 'PNG', cardX + 45, cardY + 60, 80, 15);

    // Download File
    pdf.save(`${name}_ID.pdf`);

    statusDiv.innerText = 'ID Generated and Downloaded!';
});

// Convert File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Load Image As Base64
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = reject;
    });
}
