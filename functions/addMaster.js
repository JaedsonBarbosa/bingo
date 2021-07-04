const admin = require("firebase-admin");

// Substituir este caminho pelo caminho onde você salvou o arquivo gerado pelo Firebase
const serviceAccount = require("/home/jaedson/Downloads/permissao-admin.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const uid = '' // Preencher com o id do usuário que será master

admin
  .auth()
  .setCustomUserClaims(uid, { master: true })
  .then((v) => console.log("OK"))
  .catch((e) => console.log("Oh não", e));
