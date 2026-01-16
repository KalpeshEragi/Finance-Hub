import { Router } from 'express'
import { registerRoute } from './routeRegistry'

export function createRouter(basePath: string) {
  const router = Router()

  const methods = ['get', 'post', 'put', 'delete', 'patch'] as const

  methods.forEach(method => {
    const original = (router as any)[method].bind(router)

    ;(router as any)[method] = (path: string, ...handlers: any[]) => {
      registerRoute(method.toUpperCase(), `${basePath}${path}`)
      return original(path, ...handlers)
    }
  })

  return router
}
