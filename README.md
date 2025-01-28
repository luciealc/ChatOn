# JSF Project MAR_15 "Chat-On 🐈"
`version 1.0.0` `03-02-2025`


## Description
Un mini-IRC complet avec :
- Serveur Node/Express/Socket.IO
- Client React
- Persistance MongoDB
- Multi-channels simultanés
- Messages privés (/msg)
- Auto-complétion des commandes (avec suggestions)
- 5 tests unitaires sur l'API REST, etc.


## Technologies 📱

Pour la création de ce projet, nous travaillons avec la stack MERN. Ceci est avec [MongoDB](https://www.mongodb.com/) pour la database, [ExpressJS](https://expressjs.com/) pour lancer le serveur afin de créer une API, [ReactJS](https://react.dev/) comme le framework frontend & [NodeJS](https://nodejs.org/en) comme "runtime environment" pour la programmation côté serveur.


## Structure du Projet 🏗️

Dessous vous trouverez la structure générale du projet.

```
.
├── client
│   ├── public
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.js
│   └── src
│       ├── assets
│       │   └── avatar
│       │       ├── avatar1.jpg
│       │       ├── ...
│       ├── components
│       │   ├── ChatBox.js
│       │   ├── ...
│       ├── contexts
│       ├── pages
│       │   ├── Home.js
│       │   ├── ...
│       ├── App.js
│       └── ...
│
├── server
│   ├── models
│   │   ├── Users.js
│   │   ├── ...
│   ├── .env
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── index.js
│
├── README.md
├── package.json
└── package-lock.json
```


## Installation 🪜
1. Cloner le repo
2. `cd server && npm install`
3. `cd ../client && npm install`
4. Configurer `.env` dans `server/` avec `MONGODB_URI`, `PORT`, etc.
5. Lancer `npm start` côté serveur, `npm start` côté client


## Tests
- `cd server`
- ```npm start```
- `cd server && npm test` => tests Jest + Supertest
- Couverture de test => `npm run test::coverage`


## Usage
- Commandes IRC :
  - `/nick <pseudo>`
  - `/list`
  - `/create <channel>`
  - `/delete <channel>`
  - `/join <channel>`
  - `/quit <channel>`
  - `/users [channel?]`
  - `/msg <pseudo> <message>`
  - (texte) => message public
- Auto-complétion : taper `/` => liste de commandes s’affiche


## Bug and Issue Flagging

We would love to hear your feedback on Chat-On, feel free to write it in this [feedback issue](https://github.com/EpitechMscProPromo2027/T-JSF-600-MAR_15/issues/9) .

Improving the platform is essential, so you might have some great and bright ideas to pitch to us in this [improvement issue](https://github.com/EpitechMscProPromo2027/T-JSF-600-MAR_15/issues/8) .

You're an software tester, and have found bugs and issues within the chatroom, we are thankful if you signal them in this [bug issue](https://github.com/EpitechMscProPromo2027/T-JSF-600-MAR_15/issues/10) .


##### Made with ❤️ & 😢 by Alexis Giove, Damien Marechal & Lucie Aloccio
