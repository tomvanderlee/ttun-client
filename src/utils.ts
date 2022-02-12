export function getHost() {
  // @ts-ignore
  return import.meta.env.DEV ? "localhost:4040" : window.location.host;
}
