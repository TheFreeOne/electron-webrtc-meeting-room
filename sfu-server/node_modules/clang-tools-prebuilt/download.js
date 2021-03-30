const fs = require('fs')
const os = require('os')
const path = require('path')
const pathExists = require('path-exists')
const mkdir = require('mkdirp')
const nugget = require('nugget')
const homePath = require('home-path')

module.exports = (opts, cb) => {
  const platform = opts.platform
  const revision = opts.revision

  if (!platform) return cb(new Error('must specify platform'))
  if (!revision) return cb(new Error('must specify revision'))
  const filename = 'clang-tools-r' + revision + '-' + platform + '.tgz'
  const url = 'https://github.com/hokein/clang-tools-tarball/releases/download/r' +
              revision + '/clang-tools-r' + revision + '-' + platform + '.tgz'
  const homeDir = homePath()
  const cache = path.join(homeDir, './.clang-tools')

  const cachedZip = path.join(cache, filename)
  if (pathExists.sync(cachedZip)) {
    return cb(null, cachedZip)
  } else {
    mkdir(cache, (err) => {
      if (err) return cb(err)
      nugget(url, {target: filename, dir: cache, resume: true, verbose: true}, (err) => {
        if (err) return cb(err)
        cb(null, cachedZip)
      })
    })
  }
}
