---
title: SV DPI
date: 2026-08-10
updated: 2026-08-10
tags:
  - systemverilog
  - DPI
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---
### SV DPI 简介

DPI （Direct Programming Interface）直接编程接口[^1]
- 在SV和外部编程语言C/C++之间的一种接口
- 对C模型的简单接口
	- 允许SV调用其他原生SV函数一样调用C
	- 变量可以直接从C/C++传递
- WHY DPI?
	- SV复用C/C++的设计或者测试平台
	- DPI轻松将C/C++代连接到SV
- 支持function和task
- SV调用C，C调用SV

**完整UVM验证环境**
```
uvm_test
	uvm_env
		- uvm_agent
			- uvm_sequencer
			- uvm_monitor
			- uvm_driver
```

> reference model一般使用高级语言来写C/C++/python/perl编写，一般用于模拟DUT行为
> 同一个上一级输出，同时输出给reference model和RTL，reference model软件行为编写，运行速度极快，故需要先将输出数据存入scoreboard（checker），等待RTL输出并进行比较

#### 从C import task/function到SV

必须在代码中声明**Import “DPI-C”**
- SV调用C/C++的task/function
- C的代码中必须有`#include<svdpi.h>`
例：
``` systemverilog
// SV code
program automatic test;
	import "DPI-C" context task c_tset(input int addr);
	
	initial c_test(1000);
endprogram
```

``` C
// C code
#include <svdpi.h>

void c_test(int addr) {
	...
}
```

``` bash
vcs -R -sverilog top.sv c_test.c
```
编译时同时编写.sv文件和.c文件

#### 从SV import task/function到C
必须在代码中声明**Export “DPI-C”**
- C调用SV的task/function
- C的代码中必须有`#include<svdpi.h>`
例：
``` systemverilog
// SV code
program automatic test;
	import "DPI-C" context task c_tset(input int addr);
	
	initial c_test(1000);
	
	export "DPI_C" task apb_write;
	
	task apb_write(input int addr, data)
		... @(posedge ready); ...
	endtask
endprogram
```

``` C
// C code
#include <svdpi.h>
extern void apb_write(int ,int );

void c_test(int addr) {
	...
	apb_write(addr, data);
}
```

``` bash
vcs -sverilog top.sv c_test.c
```
同样地，编译时同时编写.sv文件和.c文件

### 两个实例

#### SV DPI 例1：利用DPI调用C来批量访问register + C调用APB write驱动

> 验证IP，做得最多的事即 —— 配置寄存器（两种行为：read、write）

``` systemverilog
import "DPI" context task c_test(input int base_addr);
	program automatic top;
		semaphore bus_sem = new(1);
		export "DPI" task apb_write;
		task apb_write(input int addr, data);
			bus_sem.get(1);
			#10 $display("VLOG : APB Write : Addr = %x, Data = %x ", addr, data);
			bus_sem.put(1);
		endtask
		initial begin
			fork
			c_test(32‘h1000);
			c_test(32’h2000);
		join
		end
	endprogram
```

``` C
#include <svdpi.h>
extern void abp_write(int, int);
void c_test(int base) {
	int addr, data;
	for(addr=base; addr<base+5; addr++) {
		data = addr*100;
		apb_write(addr, data);
		printf("C_TEST: APB_Write: addr = 0x%8x, data = 0x%8x\n",addr, data);
	}
}
```

【注】：Makefile中，不饿能再使用vlogan来编译，之前的COMP和ELAB分布编译不行，必须使用`vcs -sverilog`

``` bash
TOP = top
DFILES = test.c test.sv
SEED = 1
VCOM = vcs -full64 -R -sverilog -debug_access+all -l -elab.log -sim_res=1ps -Mupdate
RUN = $(TOP).simv -l -run.log +ntb_random_seed=$(SEED) &
comp:
	$(VCOM) $(DFILES) -top $(TOP) -o $(TOP).simv
run:
	./$(RUN)
clean:
	rm -rf *.log AN.DB *simv* DVEfiles csrc *vpd ucli.key
```

#### SV DPI 例1：利用DPI调用C间接调用Perl脚本

``` C
#include <svdpi.h>
#include <stdlib.h>
#include <wait.h>

int call_perl(const char* command){
	int result = system(command);
	return WEXITSTATUS(result);
}
```

- DPI重要的一点是可以调用外部其他语言，最简单的办法就是调用system()任务，如果需要命令的返回值，使用linux的system()函数和WEXITSTATUS任务（需要`#include <wait.h>`）。
- 
``` perl
#!/usr/bin/perl

print "Perl:Hello World! \n"
exit(3)
```

- 需要在Makefile的RUN option中添加：`+script="perl hello.pl" &`[^2]才能调用perl命令。
- 调用其他语言，只要将“`perl hello.pl`”改成其他语言即可：
```bash
...同上
RUN = $(TOP).simv -l -run.log +ntb_random_seed=$(SEED) `+script="perl hello.pl" &
...
```


---

[^1]: 在SV中为DPI接口，而在Verilog中为VPI接口

[^2]: "&"结尾指的是后台执行，一般用于启用GUI工具或者多个工具
