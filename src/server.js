import nssocket from 'nssocket'
import run from './run'

const server = nssocket.createServer(socket => {
  console.log('Client connected')

  socket.data(['run'], ({ workingDir, argv, stdin }) => {
    run(workingDir, argv, stdin, data => {
      socket.send(['stdout'], { data })
    }, data => {
      socket.send(['stderr'], { data: data.toString() })
    }, () => {
      socket.end()
    })
  })
})

server.listen(5004)
