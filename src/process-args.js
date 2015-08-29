import {SourceMapConsumer} from 'source-map'

const commandsWhichNeedProcessing = [
  'get-def',
  'type-at-pos',
  'autocomplete',
]

export default function processArgs({ args, stdinTransformed }) {
  if (commandsWhichNeedProcessing.indexOf(args[0]) !== -1 && stdinTransformed != null) {
    let line = args[1]
    let column = args[2]

    if (args[3] != null) {
      line = args[2]
      column = args[3]
    }

    const sourceMap = new SourceMapConsumer(stdinTransformed.map)

    const newPos = sourceMap.generatedPositionFor({
      source: sourceMap.sources[0],
      line,
      column,
    })

    if (args[3] != null) {
      line = args[2]
      column = args[3]
      args[2] = newPos.line
      args[3] = newPos.column + 1
    } else {
      args[1] = newPos.line
      args[2] = newPos.column + 1
    }
  }
}
