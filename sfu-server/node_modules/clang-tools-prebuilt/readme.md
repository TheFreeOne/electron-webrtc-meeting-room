# clang-tools-prebuilt

[![Build Status](https://travis-ci.org/hokein/clang-tools-prebuilt.svg?branch=master)](https://travis-ci.org/hokein/clang-tools-prebuilt)

[![NPM](https://nodei.co/npm/clang-tools-prebuilt.png?downloads=true)](https://nodei.co/npm/clang-tools-prebuilt/)

Install clang tools prebuilt binaries for command-line usage via npm. The module
helps you easily install clang tools command for use without compile anything.

Currently, the module provides clang tools in [clang-tools-extra](http://clang.llvm.org/extra/):
  * clang-apply-replacements
  * [clang-rename](http://clang.llvm.org/extra/clang-rename.html)
  * [clang-tidy](http://clang.llvm.org/extra/clang-tidy/index.html)
  * [clang-include-fixer](http://clang.llvm.org/extra/include-fixer.html)
  * find-all-symbols

## Installation

Install all clang tools globally:

```
npm install -g clang-tools-prebuilt
```

Now you can run clang tools command:

```
clang-apply-replacements ...
clang-tidy ...
clang-rename ...
clang-include-fixer ...
find-all-symbols ...
```

## About

It supports macOS and Linux.
