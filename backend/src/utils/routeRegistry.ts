export type RegisteredRoute = {
  method: string
  path: string
}

const routes: RegisteredRoute[] = []

export function registerRoute(method: string, path: string) {
  routes.push({ method, path })
}

export function getRegisteredRoutes() {
  return routes
}
