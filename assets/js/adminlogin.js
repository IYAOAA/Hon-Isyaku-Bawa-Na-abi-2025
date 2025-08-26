document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await fetch('admin/admin.json');
    const admins = await response.json();

    const validAdmin = admins.find(admin => admin.username === username && admin.password === password);

    if (validAdmin) {
      alert("Login Successful! Redirecting to Dashboard...");
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid Username or Password. Try again.");
    }

  } catch (error) {
    console.error("Error loading admin.json:", error);
    alert("Unable to process login. Check console for details.");
  }
});
