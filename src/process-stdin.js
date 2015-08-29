import path from 'path'
import fs from 'fs'
import * as babel from 'babel-core'

export default function processStdin(workingDir, stdin, argv, args) {
  if (stdin != null) {
    let origPath = argv.path
    const babelrc = path.join(workingDir, '.babelrc')
    let plugins = []

    if (args[0] === 'autocomplete') {
      origPath = args[1] // TODO THIS IS FIXED TO WHAT IDE-FLOW OUTPUTS
    }

    if (fs.existsSync(babelrc)) {
      const babelrcParsed = JSON.parse(fs.readFileSync(babelrc).toString())
      plugins = babelrcParsed.plugins.map(pluginName => pluginName)
    }

    const oldCwd = process.cwd()
    process.chdir(workingDir)
    let stdinTransformed = null
    try {
      stdinTransformed = babel.transform(stdin, { filename: origPath, plugins, babelrc, optional: ['runtime'], whitelist: ['es6.constants','es6.blockScoping','es7.classProperties','es7.comprehensions','es7.decorators','es7.exportExtensions','es7.functionBind','es7.objectRestSpread','es7.trailingFunctionCommas'], sourceMaps: true })
    } catch (ex) {
      // problem with babel, probably a syntax error!
      console.log('Babel error', ex.stack)
      return {}
    }
    process.chdir(oldCwd)

    return { stdin, stdinTransformed }
  }

  return {}
}
