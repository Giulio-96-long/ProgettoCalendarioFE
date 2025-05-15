// config.js
const BASE_URL = 'http://localhost:8080';
const token    = localStorage.getItem('jwtToken');
const path     = window.location.pathname;

const onAuthPage = path.startsWith('/login') || path.startsWith('/register');

if (!token && !onAuthPage) {
  window.location.replace('/login/index.html');
}