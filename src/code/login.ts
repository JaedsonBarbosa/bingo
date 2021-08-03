import { auth, firebase, usuarios, openApp, openAdmin } from './commom'
import Alpine from 'alpinejs'

export const PhoneProvider = firebase.auth.PhoneAuthProvider.PROVIDER_ID

const captchaParams = { size: 'invisible' }
const captcha = new firebase.auth.RecaptchaVerifier('avancar', captchaParams)

const toAdmin = new URLSearchParams(window.location.search).has('admin')

function openNext() {
  if (toAdmin) openAdmin()
  else openApp()
}

Alpine.data('login', () => ({
  exibir: false,
  telefone: '',
  nome: '',
  estado: '',
  municipio: '',
  iniciadoLogado: true,
  pedirTelefone: false,
  pedirCodigo: false,

  confirmationResult: undefined as firebase.auth.ConfirmationResult | undefined,

  init() {
    auth.onAuthStateChanged(async (v) => {
      console.log(v)
      if (!v) {
        this.iniciadoLogado = false
        this.pedirTelefone = true
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
      } else openNext()
    })
  },

  proximo() {
    this.pedirTelefone = false
    if (!this.telefone.startsWith('+55')) this.telefone = '+55' + this.telefone
    firebase
      .auth()
      .signInWithPhoneNumber(this.telefone, captcha)
      .then((confirmationResult) => {
        this.confirmationResult = confirmationResult
        this.pedirCodigo = true
      })
      .catch((error) => {
        console.log(error)
        alert('Não foi possível enviar o SMS.')
      })
  },

  async logar(codigo: string) {
    if (!this.confirmationResult) return
    this.pedirCodigo = false
    await this.confirmationResult.confirm(codigo)
  },

  atualizar() {
    const { telefone, nome, estado, municipio } = this
    const data: IUsuario = { telefone, nome, estado, municipio }
    usuarios.doc(auth.currentUser!.uid).set(data, { merge: true }).then(openNext)
  },
}))

Alpine.start()
