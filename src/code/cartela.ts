interface IColunas {
  b: number[]
  i: number[]
  n: number[]
  g: number[]
  o: number[]
}

function filtrarColunasCartela(nums: number[]): IColunas {
  const sort = (a: number, b: number) => a - b
  const b = nums
    .filter((v) => v <= 15)
    .slice(0, 5)
    .sort(sort)
  const i = nums
    .filter((v) => v > 15 && v <= 30)
    .slice(0, 5)
    .sort(sort)
  const n = nums
    .filter((v) => v > 30 && v <= 45)
    .slice(0, 4)
    .sort(sort)
  const g = nums
    .filter((v) => v > 45 && v <= 60)
    .slice(0, 5)
    .sort(sort)
  const o = nums
    .filter((v) => v > 60 && v <= 75)
    .slice(0, 5)
    .sort(sort)
  return { b, i, n, g, o }
}

function calcularLinhasCartela(cols: IColunas) {
  /** @type {number[][]} */
  const linhas: number[][] = [[], [], [], [], []]
  const defAdd = (v: number, i: number) => linhas[i].push(v)
  cols.b.forEach(defAdd)
  cols.i.forEach(defAdd)
  cols.n.forEach((v, i) => linhas[i < 2 ? i : i + 1].push(v))
  linhas[2].push(-1)
  cols.g.forEach(defAdd)
  cols.o.forEach(defAdd)
  return linhas
}

function misturar(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

export function gerar(nums?: number[], ganhou = false): ICartelaExtendida {
  if (!nums) {
    const nums = [...Array(75)].map((_, i) => i + 1)
    misturar(nums)
    const cols = filtrarColunasCartela(nums)
    const { b, i, n, g, o } = cols
    return {
      ganhou,
      numeros: [...b, ...i, ...n, ...g, ...o],
      linhas: calcularLinhasCartela(cols),
    }
  } else {
    const cols = filtrarColunasCartela(nums)
    const linhas = calcularLinhasCartela(cols)
    return { ganhou, numeros: nums, linhas }
  }
}
