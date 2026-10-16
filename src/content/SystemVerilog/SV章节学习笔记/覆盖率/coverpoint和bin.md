---
title: coverpoint和bin
date: 2026-07-15
updated: 2026-07-18
tags:
  - systemverilog
  - bin
  - coverpoint
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---
### 概述

- 当在coverpoint指定采样一个变量或表达式时，SV会创建很多的“bin”来记录每个数值被捕捉到的次数。
- bin是衡量功能覆盖率的基本单位。
- covergroup中可以定义多个coverpoint，coverpoint中可以自定义多个cover bin或者SV帮助自动定义多个cover bin。

### coverpoint和bin

- 域：可能数值的个数。
- 覆盖率：采样值的数目/ bin的数目。
- coverpoint的覆盖率 -> covergroup的覆盖率 -> 整体覆盖率 （逐步构成）

### bin的创建和应用

- 创建
	- SV会默认为某个coverpoint创建bin，用户也可以自己定义bin的采样域。
	- 采样变量的域范围过大而又没有指定bin，那么系统会默认分配64个bin，将值域范围平均分配给这64个bin。
	- 用户可以通过covergroup的选项auto_bin_max来指定自动创建bin的最大数目。
- 应用
``` systemverilog
covergroup covport;
	option.auto_bin_max = 8; // 所有coverpoint auto_bin数量=8
	coverpoint tr.port
	{option.auto_bin_max = 2;} // 特定coverpoint auto_bin数量=2
endgroup	
```

### 命名coverpoint和bin

``` SystemVerilog
covergroup CovKind;
	id: coverpoint tr.kind {
		bins zero = {0}; // 1个仓代表kind==0
		bins lo = {[1:3], 5}; // 1个仓代表1:3和5
		bins hi[] = {[8:$]}; // 8个独立的仓代表8:15
		bins misc = default; // 1个仓代表剩余的所有值
	} // 没有分号
endgroup
```

> 【注意】
> 1. coverpoint定义使用{}而不是begin...end
> 2. 大括号的结尾**没有带分号”;”**
> 3. id为覆盖点的名字，而coverpoint后接的是需要收集的变量；
> 4. covergroup需要实例化才能进行后续采样

三步法：
1. `Define Covergroup/coverpoint/bins
2. `this.Covergroup_name = new();
3. `Covergroup_name.sample();

可能出现的结果：
```
Bin # hits at least
=============================
hi_8 0 1
hi_9 5 1
hi_a 3 1
hi_b 4 1
hi_c 2 1
hi_d 2 1
hi_e 9 1
hi_f 4 1
lo   16 1
misc 15 1
zero 1 1
```
- hits：击中次数；
- at least：至少击中次数；

### 条件覆盖率

- iff：给coverpoint添加条件，常用于在复位期间关闭覆盖以忽略不合理的条件触发。
- start和stop：开始和停止。

示例：
``` systemverilog
covergroup CoverPort;
	coverpoint port iff
	(!bus_if.reset);
endgroup
initial begin
	covport ck = new();
	#1ns；
	ck.stop();
	bus_if.reset = 1;
	#100ns bus_if.reset = 0;
	ck.start();
	...
end
```

### 翻转覆盖率

- coverpoint也可以用来记录变量从A值到B值的跳转情况。
- 还可以确定任何长度的翻转次数。

``` systemverilog
covergroup CoverPort;
	coverpoint port {
		bins t1 = {(0 => 1), (0 => 2), (0 => 3)};
	}
endgroup
```

### wildcard覆盖率

- 可以使用关键字wildcard来创建多个状态或者翻转。
- 在表达式中，任何X,Z或者?都会被当成0或1的通配符。

``` systemverilog
bit [2:0] port;
covergroup CoverPort;
	coverpoint port {
		wildcard bins even = {3'b??0};
		wildcard bins odd = {3'b??1};
	}
endgroup
```

### 忽略与非法
- 忽略：在某些coverpoint可能始终无法得到全部的域值。可以用`ignore_bins`，这些bin不计入coverpoint覆盖率。
示例：
``` systemverilog
bit [2:0] low_ports_0_5; // 只使用数值0-5
covergroup CoverPort;
	coverpoint low_ports_0_5 {
		ignore_bins hi = {[6,7]}; // 忽略数值6-7
	}
endgroup
```

- 非法：有些采样值不仅应该被忽略，而且如果出现还应该报错。这种情况可以在测试平台中监测，也可以使用`illegal_bins`对特定的bin进行标示。
示例：
``` systemverilog
bit [2:0] low_ports_0_5; // 只是用数值0-5
covergroup CoverPort;
	coverpoint low_ports_0_5 {
		illegal_bins hi = {[6,7]}; // 如果出现6-7便报错
	}
endgroup
```

vcs中关于代码覆盖率的命令：
<[VCS关于代码覆盖率收集选项 - SOC验证工程师 - 博客园](https://www.cnblogs.com/Alfred-HOO/articles/17589481.html)>