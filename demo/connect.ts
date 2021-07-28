import firebase from "firebase";
import "firebase/auth";
import "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyDhxqDJPSacpKe_gx1n4BppD17L4qUR8lo",
//   authDomain: "voicebingo.firebaseapp.com",
//   projectId: "voicebingo",
//   storageBucket: "voicebingo.appspot.com",
//   messagingSenderId: "574006113930",
//   appId: "1:574006113930:web:f7ef107158ce38e46f1f73",
// };

var firebaseConfig = {
  apiKey: "AIzaSyCi6Yr8TLH0DOfrUWtK9D7PL2C3CITzQRk",
  authDomain: "bingo-facil-33.firebaseapp.com",
  projectId: "bingo-facil-33",
  storageBucket: "bingo-facil-33.appspot.com",
  messagingSenderId: "920310842656",
  appId: "1:920310842656:web:b84d52d7669494509ac345"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
auth.useDeviceLanguage();
const db = firebase.firestore();

export function habilitarEmulador() {
  auth.useEmulator("http://localhost:9099");
  db.useEmulator("localhost", 8080);
}

const jogoAtivoRef = db.collection("geral").doc("jogo");
const cartelasCol = jogoAtivoRef.collection("cartelas");
const jogosEncerradosCol = db.collection("jogos");
const usuariosCol = db.collection("usuarios");
const usuarioRef = (uid: string) => usuariosCol.doc(uid);
const cartelaRef = (uid: string) => cartelasCol.doc(uid);

type TData = firebase.firestore.DocumentData;
type TDocument = firebase.firestore.DocumentReference<TData>;

interface IUsuario {
  admin?: boolean;
  telefone: string;
  nome: string;
  estado: string;
  municipio: string;
}

interface IConjuntoUsuario {
  usuario: firebase.User;
  usuarioData: IUsuario;
}

interface IJogo {
  numeros: number[];
  titulo: string;
  organizador: IUsuario;
}

interface IJogoAntigo extends IJogo {
  data: firebase.firestore.Timestamp;
  ganhador: IUsuario & { id: string };
}

interface ICartela {
  numeros: number[];
  ganhou: boolean;
}

let verificacao: firebase.auth.RecaptchaVerifier;

export async function logarUsuario(
  container: any,
  getTelefone: () => Promise<string>,
  getCodigoVerificacao: () => Promise<string>,
  getDados: () => Promise<IUsuario>
): Promise<IConjuntoUsuario> {
  let usuario = auth.currentUser;
  if (!usuario) {
    const telefone = await getTelefone();
    if (!verificacao) {
      verificacao = new firebase.auth.RecaptchaVerifier(container, {
        size: "invisible",
      });
    }
    const requisicao = await auth.signInWithPhoneNumber(
      "+55" + telefone,
      verificacao
    );
    const codigo = await getCodigoVerificacao();
    const resultadoLogin = await requisicao.confirm(codigo);
    usuario = resultadoLogin.user;
  } else alert("Usuário já está logado.");
  const userRef = usuarioRef(usuario.uid);
  try {
    const usuarioDB = await userRef.get();
    if (usuarioDB.exists)
      return { usuario, usuarioData: usuarioDB.data() as IUsuario };
  } catch (error) {}
  const usuarioData = await getDados();
  usuarioData.telefone = await getTelefone();
  await usuarioRef(usuario.uid).set(usuarioData);
  await usuario.updateProfile({ displayName: usuarioData.nome });
  return { usuario, usuarioData };
}

export async function encerrarSessao() {
  await auth.signOut();
}

export async function consultarUltimoJogo() {
  const jogo = await jogosEncerradosCol.orderBy("data", "desc").limit(1).get();
  if (jogo.empty) return undefined;
  return jogo.docs[0].data() as IJogoAntigo;
}

export async function consultar10UltimosJogos() {
  const jogo = await jogosEncerradosCol.orderBy("data", "desc").limit(10).get();
  if (jogo.empty) return [];
  return jogo.docs.map((v) => v.data() as IJogoAntigo);
}

export class Usuario {
  static current: Usuario = undefined;

  constructor(private usuario: firebase.User) {
    if (!usuario) throw new Error("Usuário necessário.");
    Usuario.current = this;
  }

  get ID() {
    return this.usuario.uid;
  }

  async getCartela(
    onAtualizacaoJogo: (jogo: IJogo) => void,
    onAtualizacaoCartela: (cartela: ICartela) => void,
    getNumeros?: () => number[]
  ) {
    const ref = cartelaRef(this.usuario.uid);
    const cartela = await ref.get();
    let cartelaData: ICartela = cartela.data() as ICartela;
    if (!cartela.exists) {
      cartelaData = {
        ganhou: false,
        numeros: (getNumeros ?? gerarNumerosCartela)(),
      } as ICartela;
      await ref.set(cartelaData);
    }
    return new Cartela(
      ref,
      cartelaData,
      onAtualizacaoJogo,
      onAtualizacaoCartela
    );
  }
}

export class Cartela {
  static current: Cartela = undefined;

  constructor(
    private ref: TDocument,
    public cartela: ICartela,
    onAtualizacaoJogo: (jogo: IJogo) => void,
    onAtualizacaoCartela: (cartela: ICartela) => void
  ) {
    const pararLeituraCartela = ref.onSnapshot((v) => {
      const data = v.data() as ICartela;
      onAtualizacaoCartela(data);
    });
    const pararLeituraJogo = jogoAtivoRef.onSnapshot((v) => {
      const jogo = v.data() as IJogo;
      onAtualizacaoJogo(jogo);
      if (!jogo) {
        pararLeituraJogo();
        pararLeituraCartela();
      }
    });
    Cartela.current = this;
  }

  async bingo() {
    await this.ref.update({ ganhou: true });
  }
}

function gerarNumerosCartela() {
  const b = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const i = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  const n = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
  const g = [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
  const o = [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75];
  return [
    ...b.sort((a, b) => Math.random() * 2 - 1).slice(0, 5),
    ...i.sort((a, b) => Math.random() * 2 - 1).slice(0, 5),
    ...n.sort((a, b) => Math.random() * 2 - 1).slice(0, 4),
    ...g.sort((a, b) => Math.random() * 2 - 1).slice(0, 5),
    ...o.sort((a, b) => Math.random() * 2 - 1).slice(0, 5),
  ];
}
