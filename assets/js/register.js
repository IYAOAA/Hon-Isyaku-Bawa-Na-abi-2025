document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const name = formData.get('name');
  const state = formData.get('state');
  const lga = formData.get('lga');
  const ward = formData.get('ward');
  const nin = formData.get('nin');
  const passportFile = formData.get('passport');

  const uniqueId = Math.floor(1000 + Math.random() * 9000) + '-' + nin.slice(-4);

  // Display success message
  document.getElementById('status').innerText = "Registration Successful! Generating ID...";

  // Load jsPDF and barcode library
  const { jsPDF } = window.jspdf;

  // Convert passport to Base64
  const passportBase64 = await fileToBase64(passportFile);

  // Create PDF
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Add watermark background (Chairman.jpg)
  const backgroundImg = 'images/Chairman.jpg';
  const backgroundBase64 = await imageToBase64(backgroundImg);
  pdf.addImage(backgroundBase64, 'JPEG', 0, 0, 210, 297); // full A4 background

  // Draw ID card box (centered)
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(40, 60, 130, 80, 5, 5, 'F');

  // Applicant passport photo
  pdf.addImage(passportBase64, 'JPEG', 45, 65, 30, 30);

  // Applicant details
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Name: ${name}`, 80, 75);
  pdf.text(`State: ${state}`, 80, 85);
  pdf.text(`LGA: ${lga}`, 80, 95);
  pdf.text(`Ward: ${ward}`, 80, 105);
  pdf.text(`NIN: ****${nin.slice(-4)}`, 80, 115);
  pdf.text(`ID: ${uniqueId}`, 80, 125);

  // Generate barcode
  const barcodeBase64 = await generateBarcode(uniqueId);
  pdf.addImage(barcodeBase64, 'PNG', 70, 135, 70, 20);

  // Save PDF
  pdf.save(`${name}_ID_Card.pdf`);

  document.getElementById('status').innerText = "Your ID Card is ready!";
});

// Convert file to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Convert image to Base64 (for watermark)
async function imageToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return await fileToBase64(blob);
}

// Generate barcode using bwip-js
async function generateBarcode(data) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const bwipjs = window.bwipjs;
    bwipjs.toCanvas(canvas, {
      bcid: 'code128',
      text: data,
      scale: 3,
      height: 10,
      includetext: true
    });
    resolve(canvas.toDataURL('image/png'));
  });
}
