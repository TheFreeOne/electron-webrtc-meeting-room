//#!/usr/bin/env node

'use strict';

const clang_tools_bin_dir = require('./')
const path = require('path')
const proc = require('child_process')

module.exports = (tool_name) => {
  let tools_bin_path = path.join(clang_tools_bin_dir, tool_name)
  let child = proc.spawn(tools_bin_path, process.argv.slice(2), {stdio: 'inherit'})
  child.on('close', (code) => {
    process.exit(code)
  })
}
