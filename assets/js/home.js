// home.js
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    if (data.home) {
      document.querySelector('.home h1').textContent = data.home.headline;
      document.querySelector('.home p').textContent = data.home.introText;
      document.querySelector('.home a.btn').textContent = data.home.buttonText;
      document.querySelector('.home a.btn').setAttribute('href', data.home.buttonLink);
    }
  })
  .catch(error => console.error('Error loading home data:', error));
