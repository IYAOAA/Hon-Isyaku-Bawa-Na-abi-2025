document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const status = document.getElementById('status');
    status.textContent = "Registration Successful! Generating ID...";

    const name = this.name.value;
    const lga = this.lga.value;
    const ward = this.ward.value;
    const nin = this.nin.value;

    const passportFile = document.getElementById('passport').files[0];
    const reader = new FileReader();
    reader.onload = async function() {
        const imgData = reader.result;

        // Prepare A4 PDF with colorful ID card
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        // Background color
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');

        // ID Card box
        doc.setDrawColor(0, 102, 51);
        doc.setFillColor(230, 255, 230);
        doc.roundedRect(30, 40, 150, 90, 5, 5, 'FD');

        // Add passport photo
        doc.addImage(imgData, "JPEG", 35, 45, 30, 30);

        // Text
        doc.setFontSize(16);
        doc.text("Hon-Isyaku-Bawa-Na-abi-2025", 70, 50);
        doc.setFontSize(12);
        doc.text(`Name: ${name}`, 70, 65);
        doc.text(`LGA: ${lga}`, 70, 75);
        doc.text(`Ward: ${ward}`, 70, 85);
        doc.text(`NIN: ${nin}`, 70, 95);

        // Barcode
        const canvas = document.createElement('canvas');
        BwipJS.toCanvas(canvas, {
            bcid: 'code128',
            text: nin,
            scale: 3,
            height: 10,
            includetext: true
        });
        const barcodeImg = canvas.toDataURL('image/png');
        doc.addImage(barcodeImg, 'PNG', 70, 100, 70, 15);

        // Save as PDF
        doc.save(`${name.replace(/\s+/g, '_')}_ID.pdf`);
        status.textContent = "ID Card Generated & Downloaded!";
    };
    reader.readAsDataURL(passportFile);
});
