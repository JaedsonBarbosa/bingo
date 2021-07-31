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
firebase.firestore().useEmulator('localhost', 8080)
firebase.auth().useEmulator('http://localhost:9099')

export const PhoneProvider = firebase.auth.PhoneAuthProvider.PROVIDER_ID
export const FieldValue = firebase.firestore.FieldValue

export const auth = firebase.auth()
export const db = firebase.firestore()
export const usuarios = db.collection('usuarios')
export const jogo = db.collection('geral').doc('jogo')
export const cartelas = jogo.collection('cartelas')
export const jogos = db.collection('jogos')

export async function carregarJogos() {
  const res = await jogos.orderBy('data', 'desc').limit(10).get()
  return res.docs.map((v) => v.data())
}

export function isAdmin(data: IUsuario, id: string) {
  return data.admin || id === 'zFL8Cz8fF4mHEgLpL4u8RgTOqt7e'
}

export function misturar(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}
