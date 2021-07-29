document.addEventListener('alpine:init', () => {
  const login = './login.html'

  /** @param {number} coluna */
  function getNumeros(coluna) {
    return [...Array(15)].map((_, i) => 15 * coluna + 1 + i)
  }

  const numsB = getNumeros(0)
  const numsI = getNumeros(1)
  const numsN = getNumeros(2)
  const numsG = getNumeros(3)
  const numsO = getNumeros(4)

  Alpine.data('webapp', () => ({
    /** @type {IJogoAntigo[]} */
    jogos: [],

    encerrarSessao() {
      auth.signOut()
      window.location.replace(login)
    },

    get telefone() {
      return auth.currentUser?.phoneNumber
    },

    /** @type {IJogo} */
    jogo: undefined,
    jogoRodando: false,
    jogoParticipando: false,
    /** @type {ICartelaExtendida} */
    cartela: undefined,

    get jogoIniciado() {
      return this.jogo?.numeros.length > 0
    },

    get linhasCartela() {
      /** @type {number[][]} */
      const linhas = [[], [], [], [], []]
      if (!this.cartela) return []
      const { b, i, n, g, o } = this.cartela
      const defAdd = (v, i) => linhas[i].push(v)
      b.forEach(defAdd)
      i.forEach(defAdd)
      n.forEach((v, i) => linhas[i < 2 ? i : i + 1].push(v))
      g.forEach(defAdd)
      o.forEach(defAdd)
      return linhas
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
      // const data = doc.data()
      this.monitorarJogo()
      this.jogos = await carregarJogos()
    },

    monitorarJogo() {
      jogo.onSnapshot(async (j) => {
        if (j.exists) {
          this.jogo = j.data()
          this.jogoRodando = true
          if (!this.cancelarMonitoramentoCartela) this.monitorarCartela()
        } else {
          if (this.jogoParticipando) {
            this.jogos = await carregarJogos()
            if (this.jogos[0]?.ganhador.id == auth.currentUser.uid) {
              alert('Parabéns! Você ganhou.')
            } else {
              alert('Que pena, você perdeu.')
            }
          }
          this.jogo = undefined
          this.jogoRodando = false
          this.jogoParticipando = false
          this.cartela = undefined
          this.cancelarMonitoramentoCartela?.()
        }
      })
    },

    /** @type {() => void} */
    cancelarMonitoramentoCartela: undefined,
    monitorarCartela() {
      this.cancelarMonitoramentoCartela = cartelas
        .doc(auth.currentUser.uid)
        .onSnapshot(async (doc) => {
          if (!doc.exists) return
          /** @type {ICartela} */
          const cartela = doc.data()
          this.jogoParticipando = true
          if (!this.cartela) {
            const nums = cartela.numeros
            const b = nums.filter((v) => numsB.includes(v))
            const i = nums.filter((v) => numsI.includes(v))
            const n = nums.filter((v) => numsN.includes(v))
            const g = nums.filter((v) => numsG.includes(v))
            const o = nums.filter((v) => numsO.includes(v))
            this.cartela = { ganhou: cartela.ganhou, b, i, n, g, o }
            return
          }
          if (this.cartela.ganhou && !cartela.ganhou) {
            const engano =
              'Você errou, faltam os números ' +
              numsCartela.filter((n) => !numsJogo.includes(n)).join(', ') +
              ' serem chamados.'
            alert(engano)
          }
          this.cartela.ganhou = cartela.ganhou
        })
    },

    async bingo() {
      await cartelas.doc(auth.currentUser.uid).update({ ganhou: true })
      alert('Aguardando análise...')
    },

    async participar() {
      /**
       * @param {number[]} nums
       * @param {number} quant
       */
      function getAleatorios(nums, quant) {
        return nums.sort(() => Math.random() * 2 - 1).slice(0, quant)
      }

      const b = getAleatorios(numsB, 5)
      const i = getAleatorios(numsI, 5)
      const n = getAleatorios(numsN, 4)
      const g = getAleatorios(numsG, 5)
      const o = getAleatorios(numsO, 5)

      const ganhou = false
      const cartelaExpandida = { ganhou, b, i, n, g, o }
      const cartela = { ganhou, numeros: [...b, ...i, ...n, ...g, ...o] }
      await cartelas.doc(auth.currentUser.uid).set(cartela)
      this.cartela = cartelaExpandida
    },
  }))
})
