document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registerForm');
  const status = document.getElementById('status');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get('name');
    const state = formData.get('state');
    const lga = formData.get('lga');
    const ward = formData.get('ward');
    const nin = formData.get('nin');
    const passportFile = formData.get('passport');

    if (!passportFile) {
      status.textContent = 'Please upload a passport photo.';
      status.style.color = 'red';
      return;
    }

    // Generate Unique ID (e.g., 2353 + last 4 of NIN)
    const uniqueId = `2353${nin.slice(-4)}`;

    // Convert Passport to Base64 for PDF
    const toBase64 = file =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

    const passportBase64 = await toBase64(passportFile);

    // Generate PDF ID Card
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', [60, 90]); // ID Card size

    // Background Color and Watermark
    doc.setFillColor(230, 250, 240);
    doc.rect(0, 0, 90, 60, 'F');
    doc.setTextColor(50, 100, 70);
    doc.setFontSize(8);
    doc.text('HON. ISYAKU BAWA NA-ABI 2025', 45, 8, { align: 'center' });

    // Watermark Text
    doc.setTextColor(200, 220, 200);
    doc.setFontSize(18);
    doc.text('REGISTERED', 45, 35, { align: 'center', angle: 30 });

    // Main Box Layout
    doc.setDrawColor(30, 70, 50);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 80, 50);

    // Passport Photo
    doc.addImage(passportBase64, 'JPEG', 6, 10, 20, 25);

    // Applicant Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Name: ${name}`, 30, 15);
    doc.text(`State: ${state}`, 30, 22);
    doc.text(`LGA: ${lga}`, 30, 28);
    doc.text(`Ward: ${ward}`, 30, 34);
    doc.text(`NIN: ****${nin.slice(-4)}`, 30, 40);
    doc.text(`ID: ${uniqueId}`, 30, 46);

    // Footer Bar
    doc.setFillColor(43, 61, 52);
    doc.rect(0, 55, 90, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('Hon-Isyaku-Bawa-Na-abi-2025', 45, 59, { align: 'center' });

    // Save PDF
    doc.save(`${name.replace(/\s+/g, '_')}_ID.pdf`);

    status.textContent = 'Registration Successful! Your ID Card has been downloaded.';
    status.style.color = 'green';
    form.reset();
  });
});
