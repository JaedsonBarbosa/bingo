import { auth, cartelas, jogo, openLogin } from './commom'
import { gerar } from './cartela'
import Alpine from 'alpinejs'
import { getLetra } from './cartela'

const webapp = () => ({
  tela: '',
  colunas: ['B', 'I', 'N', 'G', 'O'],
  numeros: [] as { v: number; c: string }[],
  cartela: [] as INumeroCartela[][],

  abrir(tela: string) {
    window.open('#' + tela, '_self')
  },

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
          .map((v) => ({ v, c: getLetra(v) }))
          .reverse()
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

  async bingo() {
    await cartelas.doc(auth.currentUser!.uid).update({ ganhou: true })
    alert('Parabéns, você ganhou!')
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
