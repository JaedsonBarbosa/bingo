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
  jogos: [] as IJogos[],
  encerrarSessao: () => auth.signOut(),
  telefone: auth.currentUser?.phoneNumber,
  jogo: undefined as IJogo | undefined,
  administradores: [] as IUsuarioExtendido[],
  usuarios: [] as IUsuarioExtendido[],

  init() {
    jogos
      .orderBy('data', 'desc')
      .limit(10)
      .onSnapshot((v) => (this.jogos = v.docs.map((k) => k.data() as IJogos)))
    usuarios.onSnapshot((v) => {
      const docs = v.docs.map((v) => ({
        ...(v.data() as IUsuario),
        inverterAdmin: () => v.ref.update({ admin: !v.get('admin') }),
      }))
      this.usuarios = docs.filter((v) => !v.admin)
      this.administradores = docs.filter((v) => v.admin)
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
      await this.encerrarJogo()
    })
  },

  async encerrarJogo() {
    const lote = db.batch()
    const registros = await cartelas.get()
    registros.docs.forEach((v) => lote.delete(v.ref))
    lote.delete(jogo)
    await lote.commit()
  },

  async novoJogo() {
    const titulo = prompt('Titulo do jogo:')
    if (!titulo) return
    const userDB = await usuarios.doc(auth.currentUser!.uid).get()
    const organizador = userDB.data() as IUsuario
    await jogo.set({ titulo, numeros: [], organizador } as IJogo)
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
    openLogin()
    return
  } else if (!iniciado) {
    Alpine.data('admin', admin)
    Alpine.start()
    iniciado = true
  }
})
