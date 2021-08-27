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

const LJOGOS = 20
const LUSUARIOS = 100

function getLetra(n: number) {
  const cols = ['B', 'I', 'N', 'G', 'O']
  const index = Math.floor((n - 1) / 15)
  return cols[index]
}

function getAleatorio<T>(r: T[]): T {
  const index = Math.floor((r.length * new Date().getMilliseconds()) / 1000)
  return r[index]
}

const admin = () => ({
  tela: '',
  jogos: [] as IJogos[],
  temMaisJogos: false,
  encerrarSessao: () => auth.signOut(),
  alterarDados: () => openLogin(true),
  telefone: auth.currentUser!.phoneNumber,
  jogo: undefined as IJogo | undefined,
  numeroCartelas: 0,
  ultimoNumero: undefined as string | undefined,
  ganhadores: [] as TSnapshot[],
  usuarios: [] as TSnapshot[],
  administradores: [] as TSnapshot[],
  temMaisUsuarios: false,
  temMaisAdministradores: false,

  abrir(tela: string) {
    window.open('#' + tela, '_self')
  },

  ufs: IBGE,

  filtroJogos: {
    ufOrganizador: '',
    ufGanhador: '',
    ateData: '',
  },

  getQueryJogos() {
    let query = jogos.orderBy('data', 'desc').limit(LJOGOS)
    const ufOrg = this.filtroJogos.ufOrganizador
    if (ufOrg) query = query.where('organizador.estado', '==', ufOrg)
    const ufGan = this.filtroJogos.ufGanhador
    if (ufGan) query = query.where('ganhador.estado', '==', ufGan)
    const ateData = this.filtroJogos.ateData
    if (ateData) query = query.where('data', '<=', new Date(ateData))
    return query
  },

  async carregarJogos() {
    const query = this.getQueryJogos()
    const res = await query.get()
    this.jogos = res.docs.map((k) => k.data() as IJogos)
    this.temMaisJogos = this.jogos.length === LJOGOS
  },

  async carregarMaisJogos() {
    const last = this.jogos[this.jogos.length - 1]
    const res = await this.getQueryJogos().startAfter(last.data).get()
    this.jogos = [...this.jogos, ...res.docs.map((k) => k.data() as IJogos)]
    if (res.docs.length < LJOGOS) this.temMaisJogos = false
  },

  filtroUsuarios: {
    nome: '',
    uf: '',
  },

  async buscarNovoAdmin(telefone: string) {
    if (!telefone.startsWith('+55')) telefone = '+55' + telefone
    const u = await usuarios.where('telefone', '==', telefone).limit(1).get()
    if (u.empty) {
      alert('Nenhum resultado foi encontrado para o número ' + telefone)
      return undefined
    }
    const v = u.docs[0]
    if (v.get('admin')) {
      alert('O usuário já é um administrador')
    } else {
      await this.inverterAdmin(v)
      alert('Usuário promovido.')
    }
  },

  async inverterAdmin(v: TSnapshot) {
    await v.ref.update({ admin: !v.get('admin') })
    this.abrir('inicio')
    this.carregarUsuarios()
  },

  getQueryUsuarios(admin = false) {
    const { nome, uf } = this.filtroUsuarios
    let query = usuarios.orderBy('nome', 'asc').limit(LUSUARIOS)
    if (nome) query = query.where('nome', '>=', nome)
    if (uf) query = query.where('estado', '==', uf)
    if (admin) query = query.where('admin', '==', true)
    return query
  },

  async carregarUsuarios() {
    this.usuarios = (await this.getQueryUsuarios().get()).docs
    this.temMaisUsuarios = this.usuarios.length === LUSUARIOS
    this.administradores = (await this.getQueryUsuarios(true).get()).docs
    this.temMaisAdministradores = this.administradores.length === LUSUARIOS
  },

  async carregarMaisUsuarios() {
    const last = this.usuarios[this.usuarios.length - 1]
    const res = await this.getQueryUsuarios().startAfter(last.get('nome')).get()
    this.usuarios = [...this.usuarios, ...res.docs]
    if (res.docs.length < LUSUARIOS) this.temMaisUsuarios = false
  },

  async carregarMaisAdministradores() {
    const last = this.administradores[this.administradores.length - 1]
    const res = await this.getQueryUsuarios(true)
      .startAfter(last.get('nome'))
      .get()
    this.administradores = [...this.administradores, ...res.docs]
    if (res.docs.length < LUSUARIOS) this.temMaisAdministradores = false
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
      if (this.jogo) {
        const numeros = this.jogo.numeros
        const last = numeros[numeros.length - 1]
        this.ultimoNumero = getLetra(last) + ' ' + last
        this.jogo.numeros.sort((a, b) => a - b)
      } else this.ultimoNumero = undefined
    })
    const finalizarJogo = async () => {
      await new Promise(res => setTimeout(res, 5000))
      const idGanhador = getAleatorio(this.ganhadores).id
      const userDB = await usuarios.doc(idGanhador).get()
      const dataUser = userDB.data() as IUsuario
      await jogos.add({
        ...this.jogo,
        ganhador: { id: idGanhador, ...dataUser },
        data: FieldValue.serverTimestamp(),
      } as IJogos)
      await this.encerrarJogo(false)
      alert(`O ganhador é ${dataUser.nome}.`)
      this.ganhadores = []
    }
    cartelas.onSnapshot((v) => {
      this.numeroCartelas = v.docs.length
      if (v.empty) return
      const _ganhadores = v.docs.filter((v) => v.get('ganhou'))
      if (this.ganhadores.length) {
        // Se já tem algum então já tem um contador rodando
        this.ganhadores = _ganhadores
      } else {
        this.ganhadores = _ganhadores
        finalizarJogo()
      }
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
    const r = [...Array(75)]
      .map((_, i) => i + 1)
      .filter((v) => !this.jogo!.numeros.includes(v))
    const n = getAleatorio(r)
    await jogo.update({ numeros: FieldValue.arrayUnion(n) })
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
