import { auth, cartelas, db, jogo, jogos, FieldValue, usuarios } from './commom'

export default () => ({
  /** @type {IJogoAntigo[]} */
  jogos: [],

  encerrarSessao() {
    auth.signOut()
  },

  get telefone() {
    return auth.currentUser?.phoneNumber
  },

  /** @type {IJogo} */
  jogo: undefined,
  jogoGerenciavel: false,

  administradores: [],
  usuarios: [],

  async adicionarAdministrador() {
    const telefone = prompt('Número de telefone:')
    if (!telefone) {
      alert('Operação cancelada pelo usuário.')
      return
    }
    const res = await usuarios.where('telefone', '==', telefone).limit(1).get()
    if (res.size == 0) {
      alert('Nenhum resultado.')
      return
    }
    await res.docs[0].ref.update({ admin: true })
    alert('Adicionado administrador.')
  },

  async removerAdministrador(id) {
    await usuarios.doc(id).update({ admin: false })
    const index = this.administradores.findIndex((v) => v.id == id)
    this.administradores.splice(index, 1)
    alert('Removido administrador.')
  },

  get ultimosNumeros() {
    const nums = this?.jogo?.numeros
    if (!nums?.length) return 'Aguardando...'
    return nums.slice().reverse().join(', ')
  },

  get ultimoNumero() {
    const nums = this?.jogo?.numeros
    if (!nums?.length) return 'Aguardando...'
    return nums[nums.length - 1]
  },

  async encerrarJogo(verificar = true) {
    const certeza = 'Tem certeza de que quer cancelar o jogo?'
    if (verificar && !confirm(certeza)) return
    const lote = db.batch()
    const registros = await cartelas.get()
    registros.docs.forEach((v) => lote.delete(v.ref))
    lote.delete(jogo)
    await lote.commit()
  },

  async novoJogo() {
    const titulo = prompt('Titulo do jogo:')
    if (!titulo) alert('Operação cancelada.')
    else {
      const userDB = await usuarios.doc(auth.currentUser.uid).get()
      /** @type {IJogo} */
      const novo = {
        titulo,
        numeros: [],
        organizador: userDB.data(),
      }
      await jogo.set(novo)
    }
  },

  async chamarNumero() {
    let numero = 0
    const nums = this.jogo.numeros
    if (nums.length == 75) {
      alert('Todos os números já foram chamados.')
      return
    }
    do {
      numero = 1 + Math.floor(Math.random() * 75)
    } while (nums.includes(numero))
    const numeros = FieldValue.arrayUnion(numero)
    await jogo.update({ numeros })
  },

  init() {
    jogos
      .orderBy('data', 'desc')
      .limit(10)
      .onSnapshot((v) => (this.jogos = v.docs.map((k) => k.data())))
    usuarios
      .where('admin', '==', true)
      .onSnapshot((v) => (this.administradores = v.docs.map((k) => k.data())))
    usuarios
      .where('admin', '==', false)
      .onSnapshot((v) => (this.usuarios = v.docs.map((k) => k.data())))
    jogo.onSnapshot((j) => {
      const jogo = j.data()
      this.jogo = jogo
      this.jogoGerenciavel =
        this.jogo?.organizador.telefone == auth.currentUser.phoneNumber
    })
    cartelas.where('ganhou', '==', true).onSnapshot(async (v) => {
      const doc = v.docs[0]
      if (!doc) return
      const userDB = await usuarios.doc(doc.id).get()
      const registro = {
        ...this.jogo,
        ganhador: { id: doc.id, ...userDB.data() },
        data: FieldValue.serverTimestamp(),
      }
      await jogos.add(registro)
      await this.encerrarJogo(false)
    })
  },
})
