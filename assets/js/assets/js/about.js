// about.js
const aboutSection = document.querySelector('.about-section');

fetch('assets/js/data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load data.json (Status: ${response.status})`);
    }
    return response.json();
  })
  .then(data => {
    if (data.about) {
      const titleElement = document.querySelector('.about-title');
      const contentElement = document.querySelector('.about-content');
      const imageElement = document.querySelector('.about-image');

      if (titleElement) titleElement.textContent = data.about.title;
      if (contentElement) contentElement.textContent = data.about.content;
      if (imageElement) imageElement.setAttribute('src', data.about.profileImage);

      if (aboutSection) aboutSection.classList.add('loaded');
    } else {
      throw new Error('About data not found in data.json');
    }
  })
  .catch(error => {
    console.error('Error loading about data:', error);

    if (aboutSection) {
      aboutSection.innerHTML = `
        <div style="background: #ffe6e6; color: darkred; padding: 15px; border-radius: 10px;">
          <h2>Unable to load profile</h2>
          <p>${error.message}</p>
          <p>Please ensure <strong>data.json</strong> is in the correct location.</p>
        </div>
      `;
    }
  });
