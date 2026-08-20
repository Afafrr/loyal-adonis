import User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'
import app from '@adonisjs/core/services/app'

export function createUser(email: string) {
  return User.create({ email, encryptedPassword: 'password123' })
}

export function bouncerFor(user: User) {
  return new Bouncer(user).setContainerResolver(app.container.createResolver())
}
