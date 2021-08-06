function filtrarColunasCartela(nums: number[]): INumeroCartela[][] {
  const sort = (a: number, b: number) => a - b
  const map = (v: number) => ({ v, m: false })
  const res = [...Array(5)].map((_, i) =>
    nums
      .filter((v) => v > 15 * i && v <= 15 * (i + 1))
      .slice(0, 5)
      .sort(sort)
      .map(map)
  )
  res[2][4] = res[2][3]
  res[2][3] = res[2][2]
  res[2][2] = { v: 0, m: false }
  return res
}

function misturar(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

export function gerar(nums?: number[]): INumeroCartela[][] {
  if (!nums) {
    const nums = [...Array(75)].map((_, i) => i + 1)
    misturar(nums)
    return filtrarColunasCartela(nums)
  } else return filtrarColunasCartela(nums)
}
