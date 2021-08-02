import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

var firebaseConfig = {
  projectId: 'bingo-facil-33',
  appId: '1:920310842656:web:b84d52d7669494509ac345',
  storageBucket: 'bingo-facil-33.appspot.com',
  locationId: 'southamerica-east1',
  apiKey: 'AIzaSyCi6Yr8TLH0DOfrUWtK9D7PL2C3CITzQRk',
  authDomain: 'bingo-facil-33.firebaseapp.com',
  messagingSenderId: '920310842656',
}
firebase.initializeApp(firebaseConfig)

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
