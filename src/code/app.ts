import {
  auth,
  usuarios,
} from './commom'
import webapp from './appData'
import Alpine from 'alpinejs'

const encerrar = auth.onAuthStateChanged(async (user) => {
  if (!user || !(await usuarios.doc(user.uid).get()).exists) {
    encerrar()
    window.location.replace('./login.html')
    return
  }
  Alpine.data('webapp', webapp)
  Alpine.start()
})
