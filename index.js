const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')
const app = new Koa()
const router = new Router()

const http = require('http').createServer(app.callback())
const io = require('socket.io')(http)

const match = createMatch()

io.on('connection', socket => {
  console.log('> connected')
  const currentPlayer = match.addPlayer(socket.id)
  socket.emit('bootstrap', match)
  socket.broadcast.emit('player-update', {
    playerId: socket.id,
    newState: currentPlayer
  })

  socket.on('disconnect', () => {
    console.log('> disconnected')
    match.removePlayer(socket.id)
    socket.broadcast.emit('player-remove', socket.id)
  })

  socket.on('player-move', move => {
    const player = match.players[socket.id]
    player[move.axis] += move.speed
    socket.broadcast.emit('player-update', {
      playerId: socket.id,
      newState: player
    })
  })
})

router.get('/', async (ctx, next) => {
  await send(ctx, 'index.html')
})

app
  .use(router.routes())
  .use(router.allowedMethods())

http.listen(3000, () => {
  console.log('Application is starting on port 3000')
})

function createMatch() {
  return {
    players: {},

    ball: {},

    addPlayer(playerId) {
      return this.players[playerId] = {
        x: 50,
        y: 50
      }
    },

    removePlayer(playerId) {
      delete this.players[playerId]
    }
  }
}
