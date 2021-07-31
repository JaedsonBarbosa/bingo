import { auth, isAdmin, usuarios } from './commom'
import admin from './admData'
import Alpine from 'alpinejs'

function openLogin() {
  window.location.replace('./login.html?admin')
}

// Mudar a forma como são gerados os números para corrigir esse problema de nunca ganhar
const encerrar = auth.onAuthStateChanged(async (user) => {
  if (!user) {
    encerrar()
    openLogin()
    return
  }
  const doc = await usuarios.doc(user.uid).get()
  if (!doc?.exists) {
    encerrar()
    openLogin()
    return
  }
  if (isAdmin(doc.data() as IUsuario, user.uid)) {
    Alpine.data('admin', admin)
    Alpine.start()
  } else {
    alert('Você não é um administrador.')
    window.location.replace('./app')
  }
})
