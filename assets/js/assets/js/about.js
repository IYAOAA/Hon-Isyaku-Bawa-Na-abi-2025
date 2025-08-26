// about.js
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    if (data.about) {
      document.querySelector('.about-title').textContent = data.about.title;
      document.querySelector('.about-content').textContent = data.about.content;
      document.querySelector('.about-image').setAttribute('src', data.about.profileImage);
    }
  })
  .catch(error => console.error('Error loading about data:', error));
