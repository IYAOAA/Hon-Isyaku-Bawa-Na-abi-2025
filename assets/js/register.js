// register.js

const form = document.getElementById('registerForm');
const statusDiv = document.getElementById('status');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission

    // Clear status message
    statusDiv.textContent = '';

    // Get form data
    const formData = new FormData(form);
    const user = {
      name: formData.get('name'),
      state: formData.get('state'),
      lga: formData.get('lga'),
      ward: formData.get('ward'),
      nin: formData.get('nin'),
      passport: formData.get('passport')
    };

    // Validate required fields
    if (!user.name || !user.state || !user.lga || !user.ward || !user.nin) {
      statusDiv.textContent = 'Please fill in all required fields.';
      statusDiv.style.color = 'red';
      return;
    }

    // Generate Unique ID
    const uniqueId = `REG-${Math.floor(Math.random() * 9000) + 1000}-${user.nin.slice(-4)}`;

    // Save user data temporarily in localStorage
    localStorage.setItem('registrationSuccess', JSON.stringify({ ...user, uniqueId }));

    // Show success message (without reloading)
    statusDiv.innerHTML = `<span style="color:green; font-weight:bold;">Registration Successful!</span><br>Your Unique ID: <strong>${uniqueId}</strong>`;

    // Generate PDF with watermark and passport
    generatePDF(user, uniqueId);

    // Reset form after submission
    form.reset();
  });
}

// Generate PDF with watermark and passport
async function generatePDF(user, uniqueId) {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  // Add watermark background
  doc.setFontSize(50);
  doc.setTextColor(240, 240, 240);
  doc.text('PDP 2025', 35, 150, { angle: 45 });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Party Membership Registration', 60, 20);

  // Passport
  const passportFile = document.querySelector('#passport').files[0];
  if (passportFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      doc.addImage(e.target.result, 'JPEG', 150, 30, 40, 40);
      finishPDF();
    };
    reader.readAsDataURL(passportFile);
  } else {
    finishPDF();
  }

  function finishPDF() {
    // Details
    doc.setFontSize(12);
    doc.text(`Name: ${user.name}`, 20, 80);
    doc.text(`State: ${user.state}`, 20, 90);
    doc.text(`LGA: ${user.lga}`, 20, 100);
    doc.text(`Ward: ${user.ward}`, 20, 110);
    doc.text(`NIN: ${user.nin}`, 20, 120);
    doc.text(`Unique ID: ${uniqueId}`, 20, 130);

    // Download PDF
    doc.save(`${user.name}_PDP_Registration.pdf`);
  }
}

// Ensure form does not auto-submit on page reload
window.addEventListener('load', () => {
  localStorage.removeItem('registrationSuccess');
});
