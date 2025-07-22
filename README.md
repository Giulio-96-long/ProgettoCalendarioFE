# ProgettoCalendario - Frontend

Frontend statico realizzato con **HTML**, **CSS** e **JavaScript vanilla**. Comunica con il backend tramite **Fetch API**.

---

## Comunicazione con il backend

La comunicazione avviene tramite `fetch()` usando l'URL `BASE_URL` definito nel file `config.js`.

Ogni richiesta privata include il token JWT:
```js
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## Come avviare

- Apri `index.html` nel browser  
- Oppure usa un server statico locale (es. Live Server)

---

## Struttura

Include pagine HTML per login, calendario, feedback e errori, oltre a script JS per navigazione, autenticazione e gestione note.

---
