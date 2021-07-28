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
