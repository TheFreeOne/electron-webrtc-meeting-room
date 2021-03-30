const tape = require('tape')
const clang_tools = require('../')
const pathExists = require('path-exists')

tape('has local binary', function (t) {
  t.ok(pathExists.sync(clang_tools), 'clang-tools was downloaded')
  t.end()
})
