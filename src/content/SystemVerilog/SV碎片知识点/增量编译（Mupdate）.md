---
title: 增量编译（Mupdate）
date: 2026-08-10
updated: 2026-08-10
tags:
  - Mupdate
  - VCS
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 使用VCS时，Makefile文件编写笔记。
---
## 功能

- 简单来说，只重新编译发生变更的文件，减少编译时间。
- 具体来说，`-mupdate`选项会让VCS检查文件的修改时间戳，并且只重新编译那些由于源文件修改而需要更新的模块和模型。这样可以避免不必要的重新编译，提高编译效率。

### 使用方法

实例说明
``` bash
elab:
	vcs -full64 -sverilog -debug_acc+all -l elab.log -sim_res=1ps -Mupdate
```

### 注意事项

- **文件依赖关系**：VCS需要准确地识别文件之间的依赖关系，才能正确地使用`-mupdate`选项进行增量编译。因此，确保代码中的文件引用和包含关系正确无误非常重要。
- **缓存清理**：如果遇到编译问题或需要强制重新编译所有文件，可以清理VCS生成的中间文件和缓存。通常可以通过删除simv(可执行文件)、csrc(编译源文件目录)等文件和目录来实现。