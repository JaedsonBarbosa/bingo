const auth = firebase.auth()
var ui = new firebaseui.auth.AuthUI(auth)

const db = firebase.firestore()
const usuarios = db.collection('usuarios')
const jogo = db.collection('geral').doc('jogo')
const cartelas = jogo.collection('cartelas')
const jogos = db.collection('jogos')

const alertaUser = 'Usuário sem informações no banco de dados.'

const raiz = {
  /** @type {firebase.UserInfo} */
  user: undefined,
  /** @type {IUsuario} */
  userDB: undefined,

  /** @type {IJogoAntigo[]} */
  jogos: [],

  async carregarJogos() {
    const res = await jogos.orderBy('data', 'desc').limit(10).get()
    this.jogos = res.docs.map((v) => v.data())
  },

  encerrarSessao() {
    auth.signOut()
  },
}
