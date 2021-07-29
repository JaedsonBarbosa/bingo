document.addEventListener('alpine:init', () => {
  const login = './login.html?admin'

  async function carregarUsuarios(admin = true) {
    const res = await usuarios.where('admin', '==', admin).get()
    return res.empty ? [] : res.docs.map((v) => ({ ...v.data(), id: v.id }))
  }

  Alpine.data('admin', () => ({
    /** @type {IJogoAntigo[]} */
    jogos: [],

    /** @type {IUsuario} */
    userDB: undefined,

    encerrarSessao() {
      auth.signOut()
      window.location.replace(login)
    },

    /** @type {IJogo} */
    jogo: undefined,
    jogoRodando: false,
    jogoGerenciavel: false,
    engano: '',

    /** @type {IUsuario[]} */
    administradores: [],

    /** @type {IUsuario[]} */
    usuarios: [],

    async adicionarAdministrador() {
      const telefone = prompt('Número de telefone:')
      if (!telefone) {
        alert('Operação cancelada pelo usuário.')
        return
      }
      const res = await usuarios
        .where('telefone', '==', telefone)
        .limit(1)
        .get()
      if (res.size == 0) {
        alert('Nenhum resultado.')
        return
      }
      await res.docs[0].ref.update({ admin: true })
      this.administradores = await carregarUsuarios()
      alert('Adicionado administrador.')
    },

    async removerAdministrador(id) {
      await usuarios.doc(id).update({ admin: false })
      const index = this.administradores.findIndex((v) => v.id == id)
      this.administradores.splice(index, 1)
      alert('Removido administrador.')
    },

    get ultimosNumeros() {
      const nums = this.jogo?.numeros
      if (!nums?.length) return 'Aguardando...'
      return nums.slice().reverse().join(', ')
    },

    get ultimoNumero() {
      const nums = this.jogo?.numeros
      if (!nums?.length) return 'Aguardando...'
      return nums[nums.length - 1]
    },

    async init() {
      const user = await new Promise((res) =>
        auth.onAuthStateChanged((v) => res(v))
      )
      if (!user) {
        window.location.replace(login)
        return
      }
      const doc = await usuarios.doc(user.uid).get()
      if (!doc.exists) {
        window.location.replace(login)
        return
      }
      const data = doc.data()
      if (!isAdmin(data, doc.id)) {
        window.location.replace('./app.html')
        return
      }
      this.userDB = data
      this.monitorarJogo()
      this.jogos = await carregarJogos()
      this.administradores = await carregarUsuarios()
      this.usuarios = await carregarUsuarios(false)
    },

    monitorarJogo() {
      jogo.onSnapshot((j) => {
        if (j.exists) {
          this.jogo = j.data()
          this.jogoRodando = true
          const gerenciavel =
            this.jogo.organizador.telefone == this.userDB.telefone
          this.jogoGerenciavel = gerenciavel
          if (gerenciavel && !this.cancelarMonitoramentoCartelas) this.monitorarCartelas()
        } else {
          this.jogo = undefined
          this.jogoRodando = false
          this.engano = ''
          this.cancelarMonitoramentoCartelas?.()
        }
      })
    },

    /** @type {() => void} */
    cancelarMonitoramentoCartelas: undefined,
    monitorarCartelas() {
      this.cancelarMonitoramentoCartelas = cartelas
        .where('ganhou', '==', true)
        .onSnapshot(async (v) => {
          const doc = v.docs[0]
          if (!doc) return
          /** @type {ICartela} */
          const cartela = doc.data()
          const numsJogo = this.jogo.numeros
          const numsCartela = cartela.numeros
          if (numsCartela.every((k) => numsJogo.includes(k))) {
            // Temos um ganhador
            const userDB = await usuarios.doc(doc.id).get()
            const registro = {
              ...this.jogo,
              ganhador: { id: doc.id, ...userDB.data() },
              data: firebase.firestore.FieldValue.serverTimestamp(),
            }
            await jogos.add(registro)
            await this.encerrarJogo(false)
            encerrar()
          } else {
            // Temos um afobado
            this.engano =
              'Alguém apertou Bingo faltando ' +
              numsCartela.filter((n) => !numsJogo.includes(n)).join(', ') +
              ' serem chamados.'
            doc.ref.update({ ganhou: false })
          }
        })
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
        /** @type {IJogo} */
        const novo = {
          titulo,
          numeros: [],
          organizador: this.userDB,
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
      const numeros = firebase.firestore.FieldValue.arrayUnion(numero)
      await jogo.update({ numeros })
    },
  }))
})
