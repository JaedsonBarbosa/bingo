import {
  auth,
  cartelas,
  db,
  jogo,
  jogos,
  FieldValue,
  usuarios,
  openLogin,
  openApp,
} from './commom'
import Alpine from 'alpinejs'

const admin = () => ({
  tela: '',
  jogos: [] as IJogos[],
  encerrarSessao: () => auth.signOut(),
  alterarDados: () => openLogin(true),
  telefone: auth.currentUser!.phoneNumber,
  jogo: undefined as IJogo | undefined,
  usuarios: [] as IUsuarioExtendido[],

  abrir(tela: string) {
    window.open('#' + tela, '_self')
  },

  init() {
    const updateTela = () => {
      const hash = window.location.hash.substr(1)
      this.tela = hash ? hash : 'inicio'
    }
    window.onhashchange = updateTela
    updateTela()
    jogos
      .orderBy('data', 'desc')
      .limit(20)
      .onSnapshot((v) => (this.jogos = v.docs.map((k) => k.data() as IJogos)))
    usuarios.onSnapshot((v) => {
      this.usuarios = v.docs.map((v) => ({
        ...(v.data() as IUsuario),
        inverterAdmin: async () => {
          await v.ref.update({ admin: !v.get('admin') })
          this.abrir('inicio')
        },
      }))
    }, openApp)
    jogo.onSnapshot((j) => {
      this.jogo = j.data() as IJogo
      this.jogo?.numeros.reverse()
    })
    cartelas.where('ganhou', '==', true).onSnapshot(async (v) => {
      if (v.empty) return
      const id = v.docs[0].id
      const userDB = await usuarios.doc(id).get()
      await jogos.add({
        ...this.jogo,
        ganhador: { id, ...userDB.data() },
        data: FieldValue.serverTimestamp(),
      } as IJogos)
      await this.encerrarJogo(false)
    })
  },

  async encerrarJogo(pedirConfirmacao = true) {
    if (pedirConfirmacao && !confirm('Tem certeza disso?')) return
    const lote = db.batch()
    const registros = await cartelas.get()
    registros.docs.forEach((v) => lote.delete(v.ref))
    lote.delete(jogo)
    await lote.commit()
    this.abrir('inicio')
  },

  async novoJogo(titulo: string) {
    const userDB = await usuarios.doc(auth.currentUser!.uid).get()
    const organizador = userDB.data() as IUsuario
    await jogo.set({ titulo, numeros: [], organizador } as IJogo)
    this.abrir('jogo')
  },

  async chamarNumero() {
    if (!this.jogo || this.jogo!.numeros.length == 75) return
    const restantes = [...Array(75)]
      .map((_, i) => i + 1)
      .filter((v) => !this.jogo!.numeros.includes(v))
    const index = Math.floor(Math.random() * restantes.length)
    await jogo.update({ numeros: FieldValue.arrayUnion(restantes[index]) })
  },
})

let iniciado = false
const encerrar = auth.onAuthStateChanged(async (user) => {
  if (!user) {
    encerrar()
    openLogin(true)
    return
  } else if (!iniciado) {
    Alpine.data('admin', admin)
    Alpine.start()
    iniciado = true
  }
})
