import { auth, jogos, cartelas, jogo, usuarios, openLogin } from './commom'
import { gerar } from './cartela'
import Alpine from 'alpinejs'

const webapp = () => ({
  isAdmin: false,
  jogos: [] as IJogos[],
  encerrarSessao: () => auth.signOut(),
  telefone: auth.currentUser?.phoneNumber,
  jogo: undefined as IJogo | undefined,
  cartela: undefined as ICartelaExtendida | undefined,

  init() {
    const user = auth.currentUser!
    if (user.uid === 'SwHkTu4OPmd42zhPKzYa5Wh3Y6i2') this.isAdmin = true
    else {
      usuarios
        .doc(user.uid)
        .get()
        .then((v) => (this.isAdmin = v.get('admin')))
    }
    jogos
      .orderBy('data', 'desc')
      .limit(10)
      .onSnapshot((v) => (this.jogos = v.docs.map((k) => k.data() as IJogos)))
    jogo.onSnapshot(async (j) => {
      if (j.exists) {
        this.jogo = j.data() as IJogo
        this.jogo.numeros.reverse()
        if (!this.cartela) {
          const doc = await cartelas.doc(user!.uid).get()
          if (!doc.exists) return
          const { ganhou, numeros } = doc.data() as ICartela
          this.cartela = gerar(numeros, ganhou)
        }
      } else {
        this.jogo = undefined
        this.cartela = undefined
      }
    })
  },

  async bingo() {
    if (!this.cartela || !this.jogo) return
    const numsCartela = this.cartela.numeros
    const numsJogo = this.jogo.numeros
    if (numsCartela.some((v) => !numsJogo.includes(v))) {
      const nums = numsCartela.filter((n) => !numsJogo.includes(n)).join(', ')
      alert('Você errou, faltam os números: ' + nums)
    } else {
      await cartelas.doc(auth.currentUser!.uid).update({ ganhou: true })
      alert('Parabéns, você ganhou!')
    }
  },

  async participar() {
    const cartela = gerar()
    const { ganhou, numeros } = cartela
    await cartelas.doc(auth.currentUser!.uid).set({ ganhou, numeros })
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
