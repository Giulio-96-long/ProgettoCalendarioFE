// config.js
const BASE_URL = 'http://localhost:8080';          
const LOGIN_URL = `${BASE_URL}/login/index.html`;

const PUBLIC_PATHS = ['/login', '/register', '/error'];  
const { pathname } = window.location;
const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

const token = localStorage.getItem('jwtToken');
if (!token && !isPublic) {
  window.location.replace(LOGIN_URL);
}