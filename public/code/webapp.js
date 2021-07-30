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

    /** @type {ICartelaExtendida} */
    cartela: undefined,

    get jogoRodando() {
      return !!this.jogo
    },

    get jogoParticipando() {
      return !!this.cartela
    },

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
      linhas[2].push(-1)
      g.forEach(defAdd)
      o.forEach(defAdd)
      return linhas
    },

    get reversoNumeros() {
      const nums = this.jogo?.numeros
      if (!nums?.length) return []
      return nums.slice().reverse()
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
      // Analisar forma de sorteamento de números dos números para fazer algo mais eficiente no admin
      // Fazer também uma exibição mais elegante em forma de tabela dos números chamados
      jogo.onSnapshot(async (j) => {
        if (j.exists) {
          this.jogo = j.data()
          if (!this.cartela) {
            const doc = await cartelas.doc(auth.currentUser.uid).get()
            const { ganhou, numeros } = doc.data()
            const nums = numeros.sort((a, b) => a - b)
            const b = nums.filter((v) => numsB.includes(v))
            const i = nums.filter((v) => numsI.includes(v))
            const n = nums.filter((v) => numsN.includes(v))
            const g = nums.filter((v) => numsG.includes(v))
            const o = nums.filter((v) => numsO.includes(v))
            this.cartela = { ganhou, numeros, b, i, n, g, o }
            return
          }
        } else {
          this.jogo = undefined
          this.cartela = undefined
        }
      })
    },

    async bingo() {
      const numsCartela = this.cartela.numeros
      const numsJogo = this.jogo.numeros
      if (numsCartela.some((v) => !numsJogo.includes(v))) {
        const engano =
          'Você errou, faltam os números ' +
          numsCartela.filter((n) => !numsJogo.includes(n)).join(', ') +
          ' serem chamados.'
        alert(engano)
      } else {
        await cartelas.doc(auth.currentUser.uid).update({ ganhou: true })
        alert('Parabéns, você ganhou!')
      }
    },

    async participar() {
      /**
       * @param {number[]} nums
       * @param {number} quant
       */
      function getAleatorios(nums, quant) {
        misturar(nums)
        return nums
          .slice(0, quant)
          .sort((a, b) => a - b)
      }

      const b = getAleatorios(numsB, 5)
      const i = getAleatorios(numsI, 5)
      const n = getAleatorios(numsN, 4)
      const g = getAleatorios(numsG, 5)
      const o = getAleatorios(numsO, 5)

      const ganhou = false
      const numeros = [...b, ...i, ...n, ...g, ...o]
      const cartelaExpandida = { ganhou, numeros, b, i, n, g, o }
      const cartela = { ganhou, numeros }
      await cartelas.doc(auth.currentUser.uid).set(cartela)
      this.cartela = cartelaExpandida
    },
  }))
})
