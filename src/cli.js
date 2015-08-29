import findParentDir from 'find-parent-dir'
import nssocket from 'nssocket'
import fs from 'fs'

const commandsWithStdin = [
  'get-def',
  'type-at-pos',
  'status',
  'autocomplete',
]

// find working flow directory and pass it to server
const workingDir = findParentDir.sync(process.cwd() + '/', '.flowconfig')

if (workingDir == null) {
  // no flow here! :(
  process.exit()
}

// stdin?
let stdin = null
if (commandsWithStdin.indexOf(process.argv[2]) !== -1) {
  stdin = fs.readFileSync('/dev/stdin').toString()
}

const client = new nssocket.NsSocket()

client.data(['stdout'], ({ data }) => process.stdout.write(data))
client.data(['stderr'], ({ data }) => process.stderr.write(data))

client.connect(5004)

client.send(['run'], { workingDir, argv: process.argv.slice(2), stdin })
