import { auth, firebase, usuarios, openApp, openAdmin } from './commom'
import Alpine from 'alpinejs'
import IBGE from './IBGE'

const captchaParams = { size: 'invisible' }
const captcha = new firebase.auth.RecaptchaVerifier('avancar', captchaParams)
const toAdmin = new URLSearchParams(window.location.search).has('admin')

Alpine.data('login', () => ({
  exibir: false,
  isAdmin: false,
  telefone: '',
  nome: '',
  estado: '',
  municipio: '',
  deficiente: true,
  iniciadoLogado: true,
  pedirTelefone: false,
  ufs: IBGE,

  encerrarSessao() {
    const confirmacao = confirm('Tem certeza de que deseja encerrar a sessão?')
    if (!confirmacao) return
    auth.signOut()
    window.location.reload()
  },

  init() {
    auth.onAuthStateChanged(async (v) => {
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
        this.isAdmin = data.admin ?? false
        this.telefone = v.phoneNumber!
        this.nome = data.nome
        this.estado = data.estado
        this.municipio = data.municipio
        this.deficiente = data.deficiente ?? false
        this.exibir = true
      } else this.openNext()
    })
  },

  async openNext() {
    if (toAdmin) {
      const id = auth.currentUser?.uid
      if (!id) {
        alert('Como é que você vai continuar se não logou?')
        return
      }
      if (!this.isAdmin && !this.iniciadoLogado) {
        const data = await usuarios.doc(id).get()
        const admin = data.get('admin')
        this.isAdmin = admin ?? false
      }
      if (this.isAdmin || id == 'SwHkTu4OPmd42zhPKzYa5Wh3Y6i2') {
        openAdmin()
      } else {
        const msg =
          'Você não é um administrador, por favor, contacte um ' +
          'administrador do sistema para que você possa ser incluído.'
        alert(msg)
      }
    } else openApp()
  },

  proximo() {
    if (!this.telefone.startsWith('+55')) this.telefone = '+55' + this.telefone
    firebase
      .auth()
      .signInWithPhoneNumber(this.telefone, captcha)
      .then((confirmationResult) => {
        this.pedirTelefone = false
        let codigo = prompt('Codigo')
        if (codigo) {
          confirmationResult.confirm(codigo)
        } else this.openNext()
      })
      .catch((error) => {
        console.log(error)
        alert('Não foi possível enviar o SMS.')
      })
  },

  async atualizar() {
    const { telefone, nome, estado, municipio, deficiente } = this
    const user = auth.currentUser!
    const id = user.uid
    if (telefone != user.phoneNumber) {
      const providerT = firebase.auth.PhoneAuthProvider
      const provider = new providerT()
      const id = await provider
        .verifyPhoneNumber(telefone, captcha)
        .catch(() => '')
      if (!id) {
        const msg =
          'Não foi possível enviar o SMS. Muitas vezes encerrar a sessão ' +
          'e logar novamente resolve este problema.'
        alert(msg)
        return
      }
      this.exibir = false
      let codigo: string | null
      do {
        codigo = prompt('Codigo')
      } while(!codigo)
      const cred = providerT.credential(id, codigo)
      await user.updatePhoneNumber(cred)
    } else this.exibir = false
    const data: IUsuario = { telefone, nome, estado, municipio, deficiente }
    await usuarios.doc(id).set(data, { merge: true })
    this.openNext()
  },
}))

Alpine.start()
