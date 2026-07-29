---
title: SystemVerilog 学习笔记（二）：数据类型
date: 2026-07-18
updated: 2026-07-18
tags:
  - systemverilog
  - data_type
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---
## SV基本数据类型

### 总览图

![基本数据类型](../../../../public/images/posts/sv_learning_note/basic-data-type.png "基本数据类型")

```
//type  data_type   signal_name
//net or var    2 or 4 state
var logic a;
wire logic b;
```

- 通常可以不定义type，工具自动根据后续变量使用的赋值自动推断成相应的type；
- wire type必须是4-state，可以多驱动；var type只能单驱动；
- sv新增加logic类型可以说正是为了替换verilog中的wire和reg类型，logic既可以是wire也可以是var；
- 为了节省程序内存，sv新增多种2-state类型；
- **口诀**：4值只有integer有符号，2值只有bit无符号。

### 类型转换

- 静态类型转换，在编译时进行，不会改变程序的运行时行为；

>类型转换：`data_type'(var) `
>数据位宽转换：`bit_size'(var)`
>符号类型转换：`signed'(var)`，`unsigned'(var)`

- 动态类型转换，在运行时进行，会改变程序的运行时行为；`$cast(des_var,source_var);`
- 类型转换可以使用`cast`操作符，也可以使用`cast`函数；
