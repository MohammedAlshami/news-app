// Test-only: `server-only` is a Next.js build-time marker that throws outside its bundler.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true }
  return nextResolve(specifier, context)
}
