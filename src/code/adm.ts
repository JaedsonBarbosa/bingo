import {
  auth,
  cartelas,
  db,
  jogo,
  jogos,
  FieldValue,
  usuarios,
  openLogin,
} from './commom'
import Alpine from 'alpinejs'
import IBGE from './IBGE'

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

  ufs: IBGE,

  filtroJogos: {
    ufOrganizador: '',
    ufGanhador: '',
    ateData: '',
  },

  carregarJogos() {
    let query = jogos.orderBy('data', 'desc').limit(10)
    const ufOrg = this.filtroJogos.ufOrganizador
    if (ufOrg) query = query.where('organizador.estado', '==', ufOrg)
    const ufGan = this.filtroJogos.ufGanhador
    if (ufGan) query = query.where('ganhador.estado', '==', ufGan)
    const ateData = this.filtroJogos.ateData
    if (ateData) query = query.where('data', '<=', new Date(ateData))
    query
      .get()
      .then((v) => (this.jogos = v.docs.map((k) => k.data() as IJogos)))
  },

  filtroUsuarios: {
    nome: '',
    uf: '',
  },

  carregarUsuarios() {
    console.log(this.filtroUsuarios)
    let query = usuarios.orderBy('nome', 'asc').limit(10)
    const nome = this.filtroUsuarios.nome
    if (nome) {
      // const next = (c: string) => String.fromCharCode(c.charCodeAt(0) + 1)
      // const end = nome.replace(/.$/, next)
      query = query.where('nome', '>=', nome) //.where('nome', '<', end)
    }
    const uf = this.filtroUsuarios.uf
    if (uf) query = query.where('estado', '==', uf)
    query.get().then(
      (v) => {
        this.usuarios = v.docs.map((v) => ({
          ...(v.data() as IUsuario),
          inverterAdmin: async () => {
            await v.ref.update({ admin: !v.get('admin') })
            this.abrir('inicio')
          },
        }))
      },
      () => alert('Aparentemente não estamos conseguindo acessar os usuários.')
    )
  },

  init() {
    const updateTela = () => {
      const hash = window.location.hash.substr(1)
      this.tela = hash ? hash : 'inicio'
    }
    window.onhashchange = updateTela
    updateTela()
    this.carregarJogos()
    this.carregarUsuarios()
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
