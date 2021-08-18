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

function getLetra(n: number) {
  const cols = ['B', 'I', 'N', 'G', 'O']
  const index = Math.floor((n - 1) / 15)
  return cols[index]
}

const admin = () => ({
  tela: '',
  jogos: [] as IJogos[],
  encerrarSessao: () => auth.signOut(),
  alterarDados: () => openLogin(true),
  telefone: auth.currentUser!.phoneNumber,
  jogo: undefined as IJogo | undefined,
  numeroCartelas: 0,
  ultimoNumero: undefined as string | undefined,
  usuarios: [] as IUsuarioExtendido[],
  administradores: [] as IUsuarioExtendido[],

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

  async buscarNovoAdmin(telefone: string) {
    if (!telefone.startsWith('+55')) telefone = '+55' + telefone
    const u = await usuarios.where('telefone', '==', telefone).limit(1).get()
    if (u.empty) {
      alert('Nenhum resultado foi encontrado para o número ' + telefone)
      return undefined
    }
    const v = u.docs[0]
    const data = v.data() as IUsuario
    if (data.admin) {
      alert('O usuário já é um administrador')
      return undefined
    }
    return {
      ...data,
      inverterAdmin: async () => {
        await v.ref.update({ admin: !v.get('admin') })
        this.abrir('inicio')
        this.carregarUsuarios()
      },
    }
  },

  async carregarUsuarios() {
    const { nome, uf } = this.filtroUsuarios
    let query = usuarios.orderBy('nome', 'asc').limit(10)
    if (nome) query = query.where('nome', '>=', nome)
    if (uf) query = query.where('estado', '==', uf)

    const mapear = (v: TSnapshot) => {
      return {
        ...(v.data() as IUsuario),
        inverterAdmin: async () => {
          await v.ref.update({ admin: !v.get('admin') })
          this.abrir('inicio')
          this.carregarUsuarios()
        },
      }
    }
    this.usuarios = (await query.get()).docs.map((v) => mapear(v))
    this.administradores = (
      await query.where('admin', '==', true).get()
    ).docs.map((v) => mapear(v))
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
    cartelas.onSnapshot(async (v) => {
      this.numeroCartelas = v.docs.length
      if (v.empty) return
      const ganhadores = v.docs.filter((v) => v.get('ganhou'))
      if (ganhadores.length == 0) return
      const id = ganhadores[0].id
      const userDB = await usuarios.doc(id).get()
      const dataUser = userDB.data() as IUsuario
      const inicio =
        ganhadores.length == 1
          ? 'O ganhador'
          : 'Tivamos mais de um ganhador, mas escolhemos o primeiro, que'
      alert(`${inicio} é ${dataUser.nome}.`)
      await jogos.add({
        ...this.jogo,
        ganhador: { id, ...dataUser },
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
  //Interessante separar o arquivo em subcontextos e subtelas independentes
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
