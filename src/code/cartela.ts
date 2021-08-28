const sort = (a: number, b: number) => a - b
const map = (v: number) => ({ v, m: false })

function filtrarColunasCartela(nums?: number[]): INumeroCartela[][] {
  if (nums) {
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
  const res = [] as { v: number; m: boolean; }[][]
  for (let i = 0; i < 5; i++) {
    const v = [] as number[]
    const base = 15 * i + 1
    while (v.length < 5) {
      const k = base + Math.floor(Math.random() * 15)
      if (!v.includes(k)) v.push(k)
    }
    res[i] = v.sort(sort).map(map)
  }
  return res
}

export function gerar(nums?: number[]): INumeroCartela[][] {
  const res = filtrarColunasCartela(nums)
  res[2][2] = { v: 0, m: false }
  return res
}
