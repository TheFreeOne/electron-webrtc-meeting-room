const download = require('./download.js')
const revision = require('./package').clang_revision
const exec = require('child_process').exec
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const os = require('os')
const dest = path.join(__dirname, './dist/')

var installed_revision = null
try {
  installed_revision = fs.readFileSync(path.join(__dirname, 'dist', 'cr_build_revision'), 'utf-8').replace(/(\n|\r)+$/, '')
} catch (err) {
  // do nothing
}

const platform = os.platform()
const platforms = {
  darwin: 'mac',
  linux: 'linux',
  freebsd: 'linux'
}

if (!platforms[platform]) throw new Error('Unknown platform: ' + platform)

if (installed_revision === revision) {
  process.exit(0)
}

download({
  'revision': revision,
  'platform': platforms[platform]
}, (err, file_path) => {
  mkdirp(dest, (error) => {
    if (error) {
      console.log(error)
      return
    }
    console.log("unziping " + file_path)
    var cmd = 'tar -xzf ' + file_path + ' -C ' + dest
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log(stderr)
        return
      }
    })
  })
});
