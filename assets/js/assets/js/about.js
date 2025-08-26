// about.js
const aboutSection = document.querySelector('.about-section');

fetch('data/data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load data/data.json (Status: ${response.status})`);
    }
    return response.json();
  })
  .then(data => {
    if (data.about) {
      const titleElement = document.querySelector('.about-title');
      const contentElement = document.querySelector('.about-content');
      const imageElement = document.querySelector('.about-image');

      // Update the DOM with fetched data
      if (titleElement) titleElement.textContent = data.about.title;
      if (contentElement) contentElement.textContent = data.about.content;
      if (imageElement) {
        imageElement.setAttribute('src', data.about.profileImage);
        imageElement.setAttribute('alt', data.about.title || 'Profile Image');
      }

      // Remove "loading" message when data is loaded
      if (aboutSection) aboutSection.classList.add('loaded');
    } else {
      throw new Error('About data not found in data/data.json');
    }
  })
  .catch(error => {
    console.error('Error loading about data:', error);

    if (aboutSection) {
      aboutSection.innerHTML = `
        <div style="background: #ffe6e6; color: darkred; padding: 15px; border-radius: 10px;">
          <h2>Unable to load profile</h2>
          <p>${error.message}</p>
          <p>Please ensure <strong>data/data.json</strong> is correctly structured and accessible.</p>
        </div>
      `;
    }
  });
