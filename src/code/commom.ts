import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

export { firebase }

firebase.initializeApp(JSON.parse(process.env.firebaseConfig as string))

export const db = firebase.firestore()
export const auth = firebase.auth()

if (process.env.NODE_ENV === 'development') {
  db.useEmulator('localhost', 8080)
  auth.useEmulator('http://localhost:9099')
}

auth.useDeviceLanguage();

export const FieldValue = firebase.firestore.FieldValue

export const usuarios = db.collection('usuarios')
export const jogo = db.collection('geral').doc('jogo')
export const cartelas = jogo.collection('cartelas')
export const jogos = db.collection('jogos')

export function openLogin(admin = false) {
  let url = './login.html'
  if (admin) url += '?admin'
  window.location.replace(url)
}

export function openApp() {
  window.location.replace('./app.html')
}

export function openAdmin() {
  window.location.replace('./adm.html')
}
