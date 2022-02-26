
// to help deal with rate-limiting
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
