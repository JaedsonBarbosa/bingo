import {
  auth,
  jogos,
  cartelas,
  isAdmin,
  jogo,
  misturar,
  usuarios,
  openLogin,
} from './commom'
import Alpine from 'alpinejs'
const getNums = (c: number) => [...Array(15)].map((_, i) => 15 * c + 1 + i)
const numsB = getNums(0)
const numsI = getNums(1)
const numsN = getNums(2)
const numsG = getNums(3)
const numsO = getNums(4)

function calcularLinhasCartela(
  b: number[],
  i: number[],
  n: number[],
  g: number[],
  o: number[]
) {
  /** @type {number[][]} */
  const linhas: number[][] = [[], [], [], [], []]
  const defAdd = (v: number, i: number) => linhas[i].push(v)
  b.forEach(defAdd)
  i.forEach(defAdd)
  n.forEach((v, i) => linhas[i < 2 ? i : i + 1].push(v))
  linhas[2].push(-1)
  g.forEach(defAdd)
  o.forEach(defAdd)
  return linhas
}

const webapp = () => ({
  init() {
    const user = auth.currentUser!
    usuarios
      .doc(user.uid)
      .get()
      .then((v) => (this.isAdmin = isAdmin(v.data() as IUsuario, user.uid)))
    jogos
      .orderBy('data', 'desc')
      .limit(10)
      .onSnapshot(
        (v) => (this.jogos = v.docs.map((k) => k.data() as IJogoAntigo))
      )
    jogo.onSnapshot(async (j) => {
      if (j.exists) {
        this.jogo = j.data() as IJogo
        this.jogo.numeros.reverse()
        if (!this.cartela) {
          const doc = await cartelas.doc(user!.uid).get()
          if (!doc.exists) return
          const { ganhou, numeros } = doc.data() as ICartela
          const nums = numeros.sort((a, b) => a - b)
          const linhas = calcularLinhasCartela(
            nums.filter((v) => numsB.includes(v)),
            nums.filter((v) => numsI.includes(v)),
            nums.filter((v) => numsN.includes(v)),
            nums.filter((v) => numsG.includes(v)),
            nums.filter((v) => numsO.includes(v))
          )
          this.cartela = { ganhou, numeros, linhas }
        }
      } else {
        this.jogo = undefined
        this.cartela = undefined
      }
    })
  },

  isAdmin: false,

  jogos: [] as IJogoAntigo[],

  encerrarSessao() {
    auth.signOut()
  },

  get telefone() {
    return auth.currentUser?.phoneNumber
  },

  jogo: undefined as IJogo | undefined,
  cartela: undefined as ICartelaExtendida | undefined,

  async bingo() {
    if (!this.cartela || !this.jogo) return
    const numsCartela = this.cartela.numeros
    const numsJogo = this.jogo.numeros
    if (numsCartela.some((v) => !numsJogo.includes(v))) {
      const engano =
        'Você errou, faltam os números ' +
        numsCartela.filter((n) => !numsJogo.includes(n)).join(', ') +
        ' serem chamados.'
      alert(engano)
    } else {
      await cartelas.doc(auth.currentUser!.uid).update({ ganhou: true })
      alert('Parabéns, você ganhou!')
    }
  },

  async participar() {
    /**
     * @param {number[]} nums
     * @param {number} quant
     */
    function getAleatorios(nums: number[], quant: number) {
      misturar(nums)
      return nums.slice(0, quant).sort((a, b) => a - b)
    }

    const b = getAleatorios(numsB, 5)
    const i = getAleatorios(numsI, 5)
    const n = getAleatorios(numsN, 4)
    const g = getAleatorios(numsG, 5)
    const o = getAleatorios(numsO, 5)

    const ganhou = false
    const numeros = [...b, ...i, ...n, ...g, ...o]
    const cartela = { ganhou, numeros }
    await cartelas.doc(auth.currentUser!.uid).set(cartela)
    const linhas = calcularLinhasCartela(b, i, n, g, o)
    this.cartela = { ganhou, numeros, linhas }
  }
})

const encerrar = auth.onAuthStateChanged((user) => {
  if (!user) {
    encerrar()
    openLogin()
    return
  }
  Alpine.data('webapp', webapp)
  Alpine.start()
})
