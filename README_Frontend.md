# ProgettoCalendario - Frontend

Frontend dell'applicazione "Calendario Settimanale" realizzato con **HTML5**, **CSS3**, e **JavaScript Vanilla**.

## Funzionalità principali

- Login utente classico e Google OAuth2
- Visualizzazione settimanale del calendario
- Aggiunta e modifica note (con colori, allegati, importanza)
- Visualizzazione feedback e risposte
- Dashboard per admin e utenti con conteggio feedback non letti
- Modali dettagliate con Bootstrap
- Validazione lato client

---

## Struttura

```
frontend/
├── index.html
├── login.html
├── register.html
├── feedback/
│   ├── feedback-admin.html
│   └── feedback-user.html
├── error-log/
│   └── error-log.html
├── assets/
│   ├── css/
│   │   └── bootstrap.min.css
│   ├── js/
│   │   └── bootstrap.bundle.min.js
├── navbar/
│   ├── navbar.js
│   └── navbar.css
├── config.js
```

---

## Configurazione

Crea un file `config.js` nella root frontend con:

```js
const BASE_URL = "http://localhost:8080";
const token = localStorage.getItem("token");
```

---

## Come avviare

1. Apri `index.html` o qualsiasi file `.html` in browser
2. (Consigliato) Servi con un web server locale (es: VSCode Live Server)


L'app sarà disponibile su:

http://localhost:5501


Assicurati che il backend accetti richieste CORS da questo dominio (`application.properties` ➜ `app.cors.allowed-origins`).


## Librerie utilizzate

- [Bootstrap 5](https://getbootstrap.com/)
- [Fetch API](https://developer.mozilla.org/docs/Web/API/Fetch_API)

---

## Autenticazione

Ogni chiamata fetch privata utilizza:

js
headers: {
  'Authorization': `Bearer ${token}`
}
