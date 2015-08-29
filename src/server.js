import 'shelljs/global'
import nssocket from 'nssocket'
import findParentDir from 'find-parent-dir'
import {spawn} from 'child_process'
import md5 from 'md5'
import path from 'path'
import fs from 'fs'
import run from './run'
import cache from './cache'

const workingDir = findParentDir.sync(process.cwd() + '/', '.flowconfig')

if (workingDir == null) {
  console.log('Run `flow-babel babel-server` from a flow project!')
  process.exit()
}

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

console.log('flow-babel server listening on 5004')

// start babel watch
const targetDir = cache.get(`targetDir:${workingDir}`, () => path.join('/tmp/flow-babel/', md5(workingDir)))
rm('-rf', targetDir)
mkdir('-p', targetDir)
ln('-sf', path.join(workingDir, '.flowconfig'), path.join(targetDir, '.flowconfig'))
ln('-sf', path.join(workingDir, 'node_modules/'), path.join(targetDir, 'node_modules'))

const babelCmd = spawn('babel', [
  '-D',
  '--stage',
  '0',
  '--whitelist',
  'es6.constants,es7.classProperties,es7.comprehensions,es7.decorators,es7.exportExtensions,es7.functionBind,es7.objectRestSpread,es7.trailingFunctionCommas,es6.blockScoping',
  '--source-maps',
  '--optional',
  'runtime',
  '--ignore',
  'node_modules',
  '--watch',
  '--out-dir',
  targetDir,
  './',
], { cwd: workingDir })
babelCmd.stderr.pipe(process.stderr)
babelCmd.stdout.pipe(process.stdout)
