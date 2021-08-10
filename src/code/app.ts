import { auth, cartelas, jogo, openLogin } from './commom'
import { gerar } from './cartela'
import Alpine from 'alpinejs'

const webapp = () => ({
  cols: ['B', 'I', 'N', 'G', 'O'],

  getCol(v: number) {
    return this.cols[Math.floor((v - 1) / 15)]
  },

  tela: '',
  jogo: undefined as IJogo | undefined,
  cartela: [] as INumeroCartela[][],
  modo: 'manual' as 'manual' | 'automatico',
  som: true,
  log: [] as string[],

  init() {
    const updateTela = () => {
      const hash = window.location.hash.substr(1)
      this.tela = hash ? hash : 'inicio'
    }
    window.onhashchange = updateTela
    this.abrir()
    updateTela()
  },

  resetar() {
    this.encerrarJogo?.()
    this.jogo = undefined
    this.cartela = []
    this.modo = 'manual'
  },

  abrir(tela = 'inicio' as 'inicio' | 'jogo' | 'vitoria') {
    if (tela == 'inicio') this.resetar()
    window.open('#' + tela, '_self')
  },

  encerrarJogo: undefined as undefined | (() => void),
  async online() {
    const monitorar = () =>
      (this.encerrarJogo = jogo.onSnapshot(async (j) => {
        if (j.exists) {
          const jogo = j.data() as IJogo
          const antigos = this.jogo!.numeros
          const novos = jogo.numeros
            .reverse()
            .filter((v) => !antigos.includes(v))
          if (novos.length) {
            const aviso =
              'Chamado' +
              (novos.length > 1 ? 's ' : ' ') +
              novos.join(', ') +
              '.'
            this.falar(aviso)
          }
          this.jogo = jogo
          if (novos.length) {
            const sufix = novos.length > 1 ? 's' : ''
            this.falar(`Chamado${sufix} ${novos.join(', ')}`)
            if (this.modo == 'automatico') {
              this.validarMarcacoes(true)
            }
          }
        } else {
          this.resetar()
          this.abrir()
        }
      }))
    if (!auth.currentUser) {
      openLogin()
      return
    }
    try {
      const obj = await jogo.get()
      if (obj.exists) {
        const data = obj.data() as IJogo
        data.numeros.reverse()
        const idUser = auth.currentUser!.uid
        const doc = await cartelas.doc(idUser).get()
        if (doc.exists) {
          this.jogo = data
          const cartela = doc.data() as ICartela
          this.cartela = gerar(cartela.numeros)
          this.validarMarcacoes()
          monitorar()
          this.falar('Cartela recuperada, bem-vindo de volta.')
          this.abrir('jogo')
        } else if (!data.numeros.length) {
          this.jogo = data
          const cartela = gerar()
          const numeros = cartela
            .flatMap((v) => v.map((k) => k.v))
            .filter((v) => v > 0)
          await cartelas.doc(idUser).set({ ganhou: false, numeros })
          this.cartela = cartela
          monitorar()
          this.falar('Cartela gerada e participação confirmada.')
          this.abrir('jogo')
        } else {
          this.cartela = []
          this.falar('Chegou tarde, o jogo já começou.')
        }
      } else this.falar('Não há nenhum jogo no momento.')
    } catch (error) {
      console.log(error)
      this.falar('Erro.')
    }
  },

  offline() {
    console.log(auth.currentUser)
    if (!auth.currentUser) {
      openLogin()
      return
    }
    this.resetar()
    this.cartela = gerar()
    this.falar('Cartela gerada, bom jogo.')
    this.abrir('jogo')
  },

  getMarcados(cartela: INumeroCartela[][]) {
    const nCartelas = cartela.flatMap((v) => v.filter((k) => k.m))
    if (nCartelas.length == 24) {
      if (this.jogo) {
        if (nCartelas.every((v) => this.jogo!.numeros.some((k) => k == v.v))) {
          cartelas
            .doc(auth.currentUser!.uid)
            .update({ ganhou: true })
            .then(() => this.abrir('vitoria'))
        } else this.falar('Você marcou números demais, amigo.')
      } else this.abrir('vitoria')
    }
    return nCartelas.length
  },

  automatico() {
    this.modo = 'automatico'
    this.validarMarcacoes(true)
  },

  validarMarcacoes(log = false) {
    if (!this.jogo) return
    const n = this.jogo.numeros
    const nCartelas = this.cartela.flat()
    nCartelas
      .filter((v) => v.m && !n.includes(v.v))
      .forEach((v) => {
        v.m = false
        if(log) this.falar(`${v.v} desmarcado.`)
      }) // Marcações erradas
    nCartelas
      .filter((v) => !v.m && n.includes(v.v))
      .forEach((v) => {
        v.m = true
        if (log) this.falar(`${v.v} marcado.`)
      }) // Marcações ignoradas
  },

  falar(texto: string) {
    if (!texto) return
    if (this.som) this.log.push(texto)
  },

  async limparLog(valor: string) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    if (this.log[0] == valor) this.log.shift()
    else console.log(this.log[0], valor)
  },
})

Alpine.data('webapp', webapp)
Alpine.start()
