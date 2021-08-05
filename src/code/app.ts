import { auth, cartelas, jogo, openLogin } from './commom'
import { gerar } from './cartela'
import Alpine from 'alpinejs'
import { getLetra } from './cartela'

const webapp = () => ({
  tela: '',
  numeros: [] as { v: number; c: string }[],
  modo: 'manual' as 'manual' | 'automatico',
  cartela: [] as INumeroCartela[][],

  init() {
    const updateTela = () => {
      const hash = window.location.hash.substr(1)
      this.tela = hash ? hash : 'inicio'
    }
    window.onhashchange = updateTela
    updateTela()
    jogo.onSnapshot(async (j) => {
      if (j.exists) {
        const jogo = j.data() as IJogo
        this.numeros = jogo.numeros
          .reverse()
          .map((v) => ({ v, c: getLetra(v) }))
        if (this.modo == 'automatico') this.validarMarcacoes()
        if (!this.cartela.length) {
          const doc = await cartelas.doc(auth.currentUser!.uid).get()
          if (!doc.exists) return
          const { numeros } = doc.data() as ICartela
          this.cartela = gerar(numeros)
        }
      } else {
        this.numeros = []
        this.cartela = []
      }
    })
  },

  abrir(tela: string) {
    window.open('#' + tela, '_self')
  },

  getMarcados(cartela: INumeroCartela[][]) {
    const nCartelas = cartela.flatMap((v) => v.filter((k) => k.m))
    const vitoria =
      nCartelas.length == 24 &&
      nCartelas.every((v) => this.numeros.some((k) => k.v == v.v))
    if (vitoria)
      cartelas
        .doc(auth.currentUser!.uid)
        .update({ ganhou: true })
        .then(() => this.abrir('vitoria'))
    return nCartelas.length
  },

  validarMarcacoes() {
    const n = this.numeros.map((v) => v.v)
    const nCartelas = this.cartela.flat()
    nCartelas
      .filter((v) => v.m && !n.includes(v.v))
      .forEach((v) => (v.m = false)) // Marcações erradas
    nCartelas
      .filter((v) => !v.m && n.includes(v.v))
      .forEach((v) => (v.m = true)) // Marcações ignoradas
  },

  manual() {
    this.modo = 'manual'
  },

  automatico() {
    this.modo = 'automatico'
    this.validarMarcacoes()
  },

  async participar() {
    const cartela = gerar()
    const numeros = cartela.flatMap((v) => v.map((k) => k.v))
    await cartelas.doc(auth.currentUser!.uid).set({ ganhou: false, numeros })
    this.cartela = cartela
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
