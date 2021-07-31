import { auth, isAdmin, PhoneProvider, usuarios, openApp } from './commom'
import * as firebaseui from "firebaseui"
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
        const idContainer = '#loginDialog'
        const loginDialog = document.querySelector(idContainer)
        if (!loginDialog) return
        const ui = new firebaseui.auth.AuthUI(auth)
        const params: any = {
          callbacks: {
            signInSuccessWithAuthResult: () => {
              loginDialog.remove()
              return false
            },
          },
          signInOptions: [
            {
              provider: PhoneProvider,
              defaultCountry: 'BR',
            },
          ],
        }
        ui.start(idContainer, params)
        return
      }
      const doc = await usuarios.doc(v.uid).get()
      if (!doc.exists) {
        this.exibir = true
        return
      }
      if (this.iniciadoLogado) {
        const data = doc.data() as IUsuario
        this.telefone = v.phoneNumber!
        this.nome = data.nome
        this.estado = data.estado
        this.municipio = data.municipio
        this.exibir = true
      } else openApp()
    })
  },

  async atualizar() {
    await usuarios.doc(auth.currentUser!.uid).set(
      {
        telefone: this.telefone,
        nome: this.nome,
        estado: this.estado,
        municipio: this.municipio,
      },
      { merge: true }
    )
    openApp()
  },
}))

Alpine.start()