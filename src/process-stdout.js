import {SourceMapConsumer} from 'source-map'

import fs from 'fs'
import path from 'path'
import sourceMapUrl from 'source-map-url'

function parseOutput(workingDir, targetDir, output) {
  const regexp = new RegExp(targetDir + '/', 'g')
  const regexp2 = new RegExp(path.join('/private', workingDir), 'g')
  let newOutput = output.replace(regexp, workingDir)
  newOutput = newOutput.replace(regexp2, workingDir)
  return newOutput
}

function fileInTemp(workingDir, targetDir, filePath) {
  const regexp = new RegExp(workingDir, 'g')
  return filePath.replace(regexp, targetDir + '/')
}

function sourceMapForFile(filePath) {
  const fileContents = fs.readFileSync(filePath).toString()
  const mapUrl = sourceMapUrl.getFrom(fileContents)
  const fullMapUrl = path.join(path.dirname(filePath), mapUrl)
  const sourceMapContents = JSON.parse(fs.readFileSync(fullMapUrl).toString())
  const smc = new SourceMapConsumer(sourceMapContents)

  return smc
}

export default function processStdout({ workingDir, targetDir, args, stdinTransformed }, callback, data) {
  const dataStr = data.toString()

  if (stdinTransformed != null) {
    // replace line numbers
    let newData = null

    try {
      newData = JSON.parse(dataStr)
      const sourceMap = new SourceMapConsumer(stdinTransformed.map)

      if (newData.line != null && newData.start != null) {
        const newPosStart = sourceMap.originalPositionFor({ line: newData.line, column: newData.start })
        const newPosEnd = sourceMap.originalPositionFor({ line: newData.endline, column: newData.end })

        newData.line = newPosStart.line
        newData.start = newPosStart.column + 1
        newData.endline = newPosEnd.line
        newData.end = newPosEnd.column + 1
      } else if (newData.errors) {
        for (let i = 0; i < newData.errors.length; i++) {
          const error = newData.errors[i]

          for (let x = 0; x < error.message.length; x++) {
            const msg = error.message[x]
            const newPosStart = sourceMap.originalPositionFor({ line: msg.line, column: msg.start })
            const newPosEnd = sourceMap.originalPositionFor({ line: msg.endline, column: msg.end })

            msg.line = newPosStart.line
            msg.start = newPosStart.column + 1
            msg.endline = newPosEnd.line
            msg.end = newPosEnd.column + 1
          }
        }
      } else if (Array.isArray(newData)) {
        for (let i = 0; i < newData.length; i++) {
          const data = newData[i]

          if (data.line != null && data.start != null) {
            const sourceMap = sourceMapForFile(fileInTemp(workingDir, targetDir, data.path))
            const newPosStart = sourceMap.originalPositionFor({ line: data.line + 2, column: data.start })
            const newPosEnd = sourceMap.originalPositionFor({ line: data.endline + 2, column: data.end })

            data.line = newPosStart.line
            data.start = newPosStart.column + 1
            data.endline = newPosEnd.line
            data.end = newPosEnd.column + 1
          }
        }
      }

      newData = JSON.stringify(newData) + '\n'
    } catch (ex) {
      newData = dataStr
      const positions = dataStr.match(/[0-9]+\:[0-9]+/g)

      if (positions != null) {
        for (const pos of positions) {
          const [ line, column ] = pos.split(':')
          const sourceMap = new SourceMapConsumer(stdinTransformed.map)
          const newPos = sourceMap.originalPositionFor({ line: parseInt(line), column: parseInt(column) })
          newData = newData.replace(pos, `${newPos.line}:${newPos.column + 1}`)
        }
      }
    }

    callback(parseOutput(workingDir, targetDir, newData))
    return
  } else {
    // replace line numbers for NORMAL FLOW COMMAND
    let newData = null

    try {
      newData = JSON.parse(dataStr)

      if (newData.errors) {
        for (let i = 0; i < newData.errors.length; i++) {
          const error = newData.errors[i]

          for (let x = 0; x < error.message.length; x++) {
            const msg = error.message[x]
            const sourceMap = sourceMapForFile(msg.path)
            const newPosStart = sourceMap.originalPositionFor({ line: msg.line, column: msg.start })
            const newPosEnd = sourceMap.originalPositionFor({ line: msg.endline, column: msg.end })

            msg.line = newPosStart.line
            msg.start = newPosStart.column + 1
            msg.endline = newPosEnd.line
            msg.end = newPosEnd.column + 1
          }
        }

        newData = JSON.stringify(newData) + '\n'
        callback(parseOutput(workingDir, targetDir, newData))
        return
      }
    } catch (ex) {
      callback(parseOutput(workingDir, targetDir, data.toString()))
      return
    }
  }

  callback(parseOutput(workingDir, targetDir, data.toString()))
}
