const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const db = admin.firestore();

exports.addAdmin = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas usuários autenticados podem acessar as funções do servidor."
      );
    }
    if (!context.auth.token.claims.master) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas administradores do sistema podem adicionar administradores."
      );
    }
    await admin.auth().setCustomUserClaims(data.uid, { admin: true });
    await db.collection("usuarios").doc(uid).update({ admin: true });
    return true;
  });

exports.delAdmin = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas usuários autenticados podem acessar as funções do servidor."
      );
    }
    if (!context.auth.token.claims.master) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas administradores do sistema podem remover administradores."
      );
    }
    if (data.uid == context.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Não é permitido remover a própria permissão de administrador."
      );
    }
    await admin.auth().setCustomUserClaims(data.uid, undefined);
    await db.collection("usuarios").doc(uid).update({ admin: false });
    return true;
  });
