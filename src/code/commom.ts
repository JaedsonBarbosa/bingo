import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

export { firebase }

const firebaseConfig = {
  apiKey: 'AIzaSyDhxqDJPSacpKe_gx1n4BppD17L4qUR8lo',
  authDomain: 'voicebingo.firebaseapp.com',
  projectId: 'voicebingo',
  storageBucket: 'voicebingo.appspot.com',
  messagingSenderId: '574006113930',
  appId: '1:574006113930:web:f7ef107158ce38e46f1f73',
}

firebase.initializeApp(firebaseConfig)

export const db = firebase.firestore()
db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED })

export const auth = firebase.auth()

if (process.env.NODE_ENV === 'development') {
  db.useEmulator('localhost', 8080)
  auth.useEmulator('http://localhost:9099')
}

db.enablePersistence()
  .then(() => console.log('Ativado cache'))
  .catch(() => console.log('Falha ao tentar ativar o cache.'))

auth.useDeviceLanguage()

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
