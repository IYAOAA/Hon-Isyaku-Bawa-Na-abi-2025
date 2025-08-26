// assets/js/about.js
document.addEventListener('DOMContentLoaded', () => {
  const aboutSection = document.querySelector('.about-section');
  const titleElement = document.querySelector('.about-title');
  const contentElement = document.querySelector('.about-content');
  const imageElement = document.querySelector('.about-image');

  fetch('data/data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load data.json (Status: ${response.status})`);
      return response.json();
    })
    .then(data => {
      if (data.about) {
        titleElement.textContent = data.about.title;
        contentElement.textContent = data.about.content;
        imageElement.src = data.about.profileImage;

        // Remove "loading..." once loaded
        aboutSection.classList.add('loaded');
      } else {
        throw new Error('Missing "about" object in data.json');
      }
    })
    .catch(error => {
      console.error('Error loading about data:', error);
      aboutSection.innerHTML = `
        <h1 style="color: darkred;">Unable to load profile</h1>
        <p>${error.message}</p>
        <p>Ensure <strong>data/data.json</strong> exists and contains valid JSON.</p>
      `;
    });
});
