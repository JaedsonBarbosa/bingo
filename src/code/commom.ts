import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

firebase.initializeApp(JSON.parse(process.env.firebaseConfig as string))

if (process.env.NODE_ENV === 'development') {
  firebase.firestore().useEmulator('localhost', 8080)
  firebase.auth().useEmulator('http://localhost:9099')
}

export const PhoneProvider = firebase.auth.PhoneAuthProvider.PROVIDER_ID
export const FieldValue = firebase.firestore.FieldValue

export const auth = firebase.auth()
export const db = firebase.firestore()
export const usuarios = db.collection('usuarios')
export const jogo = db.collection('geral').doc('jogo')
export const cartelas = jogo.collection('cartelas')
export const jogos = db.collection('jogos')

export function openLogin() {
  window.location.replace('./login.html')
}

export function openApp() {
  window.location.replace('./app.html')
}
