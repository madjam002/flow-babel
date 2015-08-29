import minimist from 'minimist'
import md5 from 'md5'
import path from 'path'
import cache from './cache'
import processStdin from './process-stdin'
import processStdout from './process-stdout'
import processArgs from './process-args'
import invokeFlow from './invoke-flow'

export default function run(workingDir, originalArgv, stdin, dataCallback, errCallback, callback) {
  console.log('Received', workingDir, originalArgv.join(' '), stdin ? stdin.length : 'no stdin')
  const targetDir = cache.get(`targetDir:${workingDir}`, () => path.join('/tmp/flow-babel/', md5(workingDir)))
  const argv = minimist(originalArgv)
  const args = argv._

  const {
    stdinTransformed,
  } = processStdin(workingDir, stdin, argv, args)

  const context = {
    workingDir,
    targetDir,
    argv,
    args,

    stdin,
    stdinTransformed,
  }

  processArgs(context)

  const flowCmd = invokeFlow(context)
  flowCmd.stdout.on('data', processStdout.bind(null, context, dataCallback))
  flowCmd.stderr.on('data', errCallback)
  flowCmd.on('close', callback)
}
