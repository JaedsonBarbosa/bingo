import {
  auth,
  usuarios,
} from './commom'
import webapp from './appData'
import Alpine from 'alpinejs'

function openLogin() {
  window.location.replace('./login.html?admin')
}

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
  //Remover analise se está no DB (pois teoricamente, deve estar)
  //Pôr botão para editar dados cadastrais
  Alpine.data('webapp', webapp)
  Alpine.start()
})
