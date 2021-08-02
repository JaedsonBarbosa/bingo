import { auth, PhoneProvider, usuarios, openApp } from './commom'
import * as firebaseui from 'firebaseui'
import Alpine from 'alpinejs'

Alpine.data('login', () => ({
  exibir: false,
  telefone: '',
  nome: '',
  estado: '',
  municipio: '',
  iniciadoLogado: true,

  init() {
    auth.onAuthStateChanged(async (v) => {
      if (!v) {
        this.iniciadoLogado = false
        const loginDialog = document.querySelector('#loginDialog')
        if (!loginDialog) return
        const ui = new firebaseui.auth.AuthUI(auth)
        const provider = {
          provider: PhoneProvider,
          defaultCountry: 'BR',
          recaptchaParameters: {
            type: 'audio',
            size: 'invisible',
            badge: 'bottomright'
          },
        }
        const callbacks = { signInSuccessWithAuthResult: () => false }
        ui.start(loginDialog, { callbacks, signInOptions: [provider] })
        return
      }
      const doc = await usuarios.doc(v.uid).get()
      if (!doc.exists) {
        this.telefone = v.phoneNumber!
        this.exibir = true
      } else if (this.iniciadoLogado) {
        const data = doc.data() as IUsuario
        this.telefone = v.phoneNumber!
        this.nome = data.nome
        this.estado = data.estado
        this.municipio = data.municipio
        this.exibir = true
      } else openApp()
    })
  },

  atualizar() {
    const { telefone, nome, estado, municipio } = this
    const data: IUsuario = { telefone, nome, estado, municipio }
    usuarios.doc(auth.currentUser!.uid).set(data, { merge: true }).then(openApp)
  },
}))

Alpine.start()
