import {spawn} from 'child_process'

export default function invokeFlow({ targetDir, argv, stdinTransformed }) {
  let newArgs = argv._.length >= 1 ? argv._[0] + ' ' : ''

  for (const k in argv) {
    if (k === '_') continue
    if (argv[k] === true) newArgs += '--' + k + ' '
    else if (argv[k]) newArgs += '--' + k + ' ' + argv[k] + ' '
  }

  for (let i = 1; i < argv._.length; i++) {
    newArgs += argv._[i] + ' '
  }

  newArgs = newArgs.split(' ').slice(0, newArgs.split(' ').length - 1)

  const flowCmd = spawn('flow', newArgs, { cwd: targetDir })
  if (stdinTransformed != null) flowCmd.stdin.write(stdinTransformed.code)
  flowCmd.stdin.end()

  return flowCmd
}
