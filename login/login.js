document.addEventListener('DOMContentLoaded', () => {

  // Signup
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function(event) {
      event.preventDefault(); 

      const username = document.getElementById('username').value.trim();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const lastname = document.getElementById('lastname').value.trim();

      // VALIDAZIONI FRONT-END
      if (!username || !lastname || !email || !password) {
        alert('Tutti i campi sono obbligatori.');
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        alert('Inserisci un indirizzo email valido.');
        return;
      }

      if (password.length < 6 || password.length > 20) {
        alert('La password deve avere tra 6 e 20 caratteri.');
        return;
      }

      registerUser(username, email, password, lastname);
    });
  }

  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();  

      const loginEmail    = document.getElementById('loginEmail').value.trim();
      const loginPassword = document.getElementById('loginPassword').value;

      // VALIDAZIONI FRONT-END
      if (!loginEmail || !loginPassword) {
        alert('Email e password sono obbligatorie per il login.');
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(loginEmail)) {
        alert('Inserisci un indirizzo email valido.');
        return;
      }

      loginUser(loginEmail, loginPassword);
    });
  }
});

function registerUser(username, email, password, lastname) {
  const data = { username, email, password, lastname };

  fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('Registrazione riuscita:', data);   
    window.location.href = '/login/index.html';
  })
  .catch(error => {
    console.error('Errore registrazione:', error);
    alert('Registrazione fallita. Riprova più tardi.');
  });
}

function loginUser(email, password) {
  const data = { email, password };

  fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('Login riuscito:', data);    
    localStorage.setItem('jwtToken', data.token);  
    window.location.href = '../calendar/calendar.html';
  })
  .catch(error => {
    console.error('Errore login:', error);
    alert('Login fallito. Controlla credenziali.');
  });
}

