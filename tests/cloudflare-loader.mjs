const cloudflareWorkersModule =
  "data:text/javascript," + encodeURIComponent("export const env = {}; export const waitUntil = () => {}; export const runInDurableObject = async (_stub, callback) => callback();");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: cloudflareWorkersModule, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
