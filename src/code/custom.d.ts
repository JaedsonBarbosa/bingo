type TData = firebase.default.firestore.DocumentData
type TDocument = firebase.default.firestore.DocumentReference<TData>

interface IUsuario {
  admin?: boolean
  telefone: string
  nome: string
  estado: string
  municipio: string
}

interface IJogo {
  numeros: number[]
  titulo: string
  organizador: IUsuario
}

interface IJogoAntigo extends IJogo {
  data: firebase.default.firestore.Timestamp
  ganhador: IUsuario & { id: string }
}

interface ICartela {
  ganhou: boolean
  numeros: number[]
}

interface ICartelaExtendida extends ICartela {
  b: number[]
  i: number[]
  n: number[]
  g: number[]
  o: number[]
}
