import { auth, cartelas, jogo, openLogin } from './commom'
import { gerar } from './cartela'
import Alpine from 'alpinejs'

const webapp = () => ({
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
    this.abrir('inicio')
    updateTela()
  },

  abrir(tela = 'inicio' as 'inicio' | 'jogo' | 'vitoria') {
    if (tela == 'inicio') this.encerrarJogo?.()
    window.open('#' + tela, '_self')
  },

  encerrarJogo: undefined as undefined | (() => void),
  async online() {
    const monitorar = () =>
      (this.encerrarJogo = jogo.onSnapshot(async (j) => {
        if (j.exists) {
          this.jogo = j.data() as IJogo
          if (this.modo == 'automatico') {
            this.validarMarcacoes()
          }
        } else {
          this.jogo = undefined
          this.modo = 'manual'
          this.cartela = []
          this.abrir()
        }
      }))
    const obj = await jogo.get()
    if (obj.exists) {
      const data = obj.data() as IJogo
      const doc = await cartelas.doc(auth.currentUser!.uid).get()
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
        const numeros = cartela.flatMap((v) => v.map((k) => k.v))
        await cartelas
          .doc(auth.currentUser!.uid)
          .set({ ganhou: false, numeros })
        this.cartela = cartela
        monitorar()
        this.falar('Cartela gerada e participação confirmada.')
        this.abrir('jogo')
      } else {
        this.cartela = []
        this.falar('Chegou tarde, o jogo já começou.')
      }
    } else this.falar('Não há nenhum jogo no momento.')
  },

  offline() {
    this.encerrarJogo?.()
    this.cartela = gerar()
    this.falar('Cartela gerada, bom jogo.')
    this.abrir('jogo')
  },

  getMarcados(cartela: INumeroCartela[][]) {
    const nCartelas = cartela.flatMap((v) => v.filter((k) => k.m))
    const vitoria =
      nCartelas.length == 24 &&
      nCartelas.every((v) => this.jogo?.numeros.some((k) => k == v.v))
    if (vitoria) {
      cartelas
        .doc(auth.currentUser!.uid)
        .update({ ganhou: true })
        .then(() => this.abrir('vitoria'))
    }
    return nCartelas.length
  },

  automatico() {
    this.modo = 'automatico'
    this.validarMarcacoes()
  },

  validarMarcacoes() {
    if (!this.jogo) return
    const n = this.jogo.numeros
    const nCartelas = this.cartela.flat()
    nCartelas
      .filter((v) => v.m && !n.includes(v.v))
      .forEach((v) => (v.m = false)) // Marcações erradas
    nCartelas
      .filter((v) => !v.m && n.includes(v.v))
      .forEach((v) => (v.m = true)) // Marcações ignoradas
  },

  falar(texto: string) {
    this.log.push(texto)
  },
})

let iniciado = false
const encerrar = auth.onAuthStateChanged((user) => {
  if (!user) {
    encerrar()
    openLogin()
  } else if (!iniciado) {
    Alpine.data('webapp', webapp)
    Alpine.start()
    iniciado = true
  }
})
