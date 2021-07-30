const auth = firebase.auth()
const db = firebase.firestore()
const usuarios = db.collection('usuarios')
const jogo = db.collection('geral').doc('jogo')
const cartelas = jogo.collection('cartelas')
const jogos = db.collection('jogos')

async function carregarJogos() {
  const res = await jogos.orderBy('data', 'desc').limit(10).get()
  return res.docs.map((v) => v.data())
}

function isAdmin(data, id) {
  return data.admin || id === 'zFL8Cz8fF4mHEgLpL4u8RgTOqt7e'
}

function misturar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}
