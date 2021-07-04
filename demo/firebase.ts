import firebase from "firebase";
import "firebase/auth";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi6Yr8TLH0DOfrUWtK9D7PL2C3CITzQRk",
  authDomain: "bingo-facil-33.firebaseapp.com",
  projectId: "bingo-facil-33",
  storageBucket: "bingo-facil-33.appspot.com",
  messagingSenderId: "920310842656",
  appId: "1:920310842656:web:b84d52d7669494509ac345",
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
auth.useDeviceLanguage();
const db = firebase.firestore();
const functions = firebase.app().functions("southamerica-east1");

export function habilitarEmulador() {
  auth.useEmulator("http://localhost:9099");
  db.useEmulator("localhost", 8080);
  functions.useEmulator("localhost", 5001);
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

interface ICartelaExtendida extends ICartela {
  id: string;
  ref: TDocument;
}

export async function logarUsuario(
  container: any,
  telefone: string,
  getCodigoVerificacao: () => Promise<string>,
  getDados: () => Promise<IUsuario>
): Promise<IConjuntoUsuario> {
  let usuario = auth.currentUser;
  if (!usuario) {
    const verificacao = new firebase.auth.RecaptchaVerifier(container, {
      size: "invisible",
    });
    const requisicao = await auth.signInWithPhoneNumber(
      "+55" + telefone,
      verificacao
    );
    const codigo = await getCodigoVerificacao();
    const resultadoLogin = await requisicao.confirm(codigo);
    usuario = resultadoLogin.user;
  }
  const userRef = usuarioRef(usuario.uid);
  try {
    const usuarioDB = await userRef.get();
    if (usuarioDB.exists)
      return { usuario, usuarioData: usuarioDB.data() as IUsuario };
  } catch (error) {}
  const usuarioData = await getDados();
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

export class Administrador {
  private constructor(private usuario: IUsuario, private master: boolean) {
    if (!usuario) throw new Error("Usuário necessário.");
  }

  static current: Administrador = undefined;

  static async create(usuario: IConjuntoUsuario) {
    console.log(usuario);
    const idTokenResult = await usuario.usuario.getIdTokenResult();
    const isMaster = idTokenResult.claims.master;
    const isAdmin = idTokenResult.claims.admin;
    if (!isMaster && !isAdmin) throw new Error("Permissão negada.");
    this.current = new Administrador(usuario.usuarioData, isMaster);
    return this.current;
  }

  async abrirJogo(getTitulo: () => Promise<string>, params: IJogoParams) {
    const ativo = await jogoAtivoRef.get();
    if (ativo.exists) return new Jogo(params);
    return await Jogo.criar(await getTitulo(), this.usuario, params);
  }

  async adicionarAdministrador(uid: string) {
    await functions.httpsCallable("addAdmin")({ uid });
  }

  async removerAdministrador(uid: string) {
    if (!this.master) throw new Error("Permissão negada.");
    return await functions.httpsCallable("delAdmin")({ uid });
  }

  async listarAdministradoresAtivos() {
    const admins = await usuariosCol.where("admin", "==", true).get();
    return admins.docs.map((v) => {
      return { ...(v.data() as IUsuario), id: v.id };
    });
  }

  async listarAdministradoresInativos() {
    const admins = await usuariosCol.where("admin", "==", false).get();
    return admins.docs.map((v) => {
      return { ...(v.data() as IUsuario), id: v.id };
    });
  }
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

interface IJogoParams {
  onFalso: (usuario: IUsuario, numerosFaltantes: number[]) => Promise<void>;
  onGanhador: (usuario: IUsuario, numerosCartela: number[]) => Promise<void>;
  onEncerramento: () => void;
}

function numeroAleatorio(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export class Jogo {
  private jogoAtivo: IJogo;
  private cartelas: ICartelaExtendida[];

  constructor(private params: IJogoParams) {
    const pararLeituraJogo = jogoAtivoRef.onSnapshot((v) => {
      const jogo = v.data();
      if (!jogo) {
        pararLeituras();
        params.onEncerramento();
      } else this.jogoAtivo = jogo as IJogo;
    });
    const pararLeituraCartelas = cartelasCol.onSnapshot(async ({ docs }) => {
      const cartelas = docs.map((v) => {
        return {
          ...(v.data() as ICartela),
          id: v.id,
          ref: v.ref,
        } as ICartelaExtendida;
      });
      this.cartelas = cartelas;
      const possivel = cartelas.find((v) => v.ganhou);
      if (!possivel) return; // Ninguém falou Bingo
      const numeros = possivel.numeros;
      const usuarioDB = await usuarioRef(possivel.id).get();
      const usuario = usuarioDB.data() as IUsuario;
      const numerosChamados = this.jogoAtivo.numeros;
      if (numeros.every((n) => numerosChamados.includes(n))) {
        pararLeituras();
        params.onGanhador(usuario, numeros);
        await jogosEncerradosCol.add({
          ...this.jogoAtivo,
          ganhador: {
            id: possivel.id,
            ...usuario,
          },
          data: firebase.firestore.FieldValue.serverTimestamp(),
        } as IJogoAntigo);
        await this.encerrar();
        params.onEncerramento();
      } else {
        const faltantes = numeros.filter((n) => !numerosChamados.includes(n));
        await params.onFalso(usuario, faltantes);
        await possivel.ref.update({ ganhou: false });
      }
    });
    function pararLeituras() {
      pararLeituraJogo();
      pararLeituraCartelas();
    }
    Jogo.current = this;
  }

  static current: Jogo = undefined;

  static async criar(
    titulo: string,
    organizador: IUsuario,
    params: IJogoParams
  ) {
    if (!titulo || titulo.length < 4) throw new Error("Titulo inválido");
    await jogoAtivoRef.set({ titulo, numeros: [], organizador } as IJogo);
    return new Jogo(params);
  }

  async adicionarNumero(numero: number) {
    if (numero < 1 || numero > 75) throw new Error("Numero invalido.");
    const numeros = firebase.firestore.FieldValue.arrayUnion(numero);
    await jogoAtivoRef.update({ numeros });
    this.jogoAtivo.numeros.push(numero);
  }

  async adicionarNumeroAleatorio() {
    let numero = 0;
    if (this.jogoAtivo.numeros.length == 75)
      throw new Error("Todos os números já foram chamados.");
    do {
      numero = numeroAleatorio(1, 75);
    } while (this.jogoAtivo.numeros.includes(numero));
    await this.adicionarNumero(numero);
    return numero;
  }

  async encerrar() {
    const lote = db.batch();
    this.cartelas.forEach((v) => lote.delete(v.ref));
    lote.delete(jogoAtivoRef);
    await lote.commit();
    this.params.onEncerramento();
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
