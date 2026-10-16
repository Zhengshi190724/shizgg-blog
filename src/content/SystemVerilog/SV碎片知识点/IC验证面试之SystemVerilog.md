---
title: IC验证面试之SystemVerilog
date: 2026-09-01
updated: 2026-09-01
tags:
  - systemverilog
  - IC验证面试
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---
>验证的目的：让设计的代码符合设计文档的要求。

 ## 类

1. 使用类：先声明句柄`Transaction tr;`，为Transaction分配空间`tr = new();`
2. 使用类中对象：类中定义了`bit a;`以及`function void aa;`那么，设置变量a可用`tr.a=1;`，调用子程序可用`t.aa();`
3. `extern`：class中先声明function名`extern function void display();`，function具体功能可以写在`class`外部；
4. 定义类中变量：`static public int a`
	- 修饰符：未指定是默认为`public`
		- `public`：允许类内部访问、子类访问、类外部访问；`class aa; public a = 0; endclass`，那么`initial begin aa::a = 2; end`是允许的；
		- `protected`：允许类内部访问、子类访问，但不允许类外部访问；`class aa; protected a = 0; endclass`，那么`initial begin aa::a = 2; end`是禁止的；
		- `local`：只允许类内部访问，上述代码同理禁止。
	- 动态/静态变量：
		- 静态变量（static）-> 类比硬件
			- static关键字声明；
			- 特点：
				- 存在于整个仿真期间；
				- 仅在仿真开始时初始化一次；
				- 未显式初始化默认为0或null；
			- module默认静态变量；
		- 动态变量（automatic）-> 类比软件
			- automatic关键字声明；
			- 特点：
				- 随作用域创建/销毁；
				- 每次进入作用域重新初始化；
				- 未初始化为X（4值），0（2值）
			- class和function/task中默认为动态变量；
	- 静态/实例变量
		- 静态变量访问`ClassName::var`，实例变量访问`objectHandle.var`
5. [[function和task]]：function中参数列表默认定义为logic input类型；
6. 类的三要素：
	- 封装：将数据和操作数据的函数**捆绑在一起**，形成一个类。同时可以通过**访问控制**（修饰符）来限制外部代码对类内部数据和方法的直接访问。
	- 继承：允许基类/父类创建派生类/子类。子类自动继承父类的非`local`成员，并可以添加自己特有的成员或重写/override继承来的方法。
	- 多态：指同一个操作（方法调用）可以根据作用对象的不同类型（实际指向的对象是父类还是某个子类的实例）而表现出不同的行为。
		- [[虚方法]]：父类用`virtual`关键字声明`function`/`task`。
		- 方法重写：子类中用相同签名（方法名、参数、返回类型）重新定义父类的`virtual`
		- 父类句柄指向子类对象：父类句柄调用虚方法，该句柄实际指向子类对象。
		- 子类向父类的转换称为向上类型转换；从父类向子类的转换，称为向下类型转换；
		- 向上类型转换是安全的，而反之则是不安全的。向下类型转换要用到`$cast`。但是需要条件是：
			- 子类声明句柄时声明两个指针a和b；
			- 需要先将子类a或者b向父类转换，此时父类（或叫基类）句柄指向派生类对象；
			- 再使用$cast，将父类转换成**另一个**子类 ——>子类的句柄指向父类句柄指向的子类的对象。
			- 主要再UVM作业，体现在driver。
7. 作用域：内部可访问外部，外部无法访问内部。
	- 例：module内定义变量a，class内定义变量b，可以在class内display a 或 b，但是无法在class外module内display b。
8. 覆盖率：
	- 概括：衡量芯片功能验证是否完备的指标。
	- 主要需要验证功能覆盖率：
		- 需要使用带有约束的随机化（修改seed，调整约束）来满足覆盖率；
		- 定向测试corner来满足覆盖率。
	- 类型：
		- 代码覆盖率：检测对设计代码运行程度的衡量，分为line path toggle FSM四个；
		- 功能覆盖率：确保设计在实际环境中得行为正确；
		- 断言覆盖率：核对 **两个设计信号**之间关系的声明性代码。
9. `fsdb`相关的系统函数作用

| 系统任务            | 作用              | 关键参数       |
| --------------- | --------------- | ---------- |
| `$fsdbDumpfile` | 创建并命名 FSDB 波形文件 | 文件名、大小限制   |
| `$fsdbDumpvars` | 指定要记录的信号层次和类型   | 深度、实例名、选项  |
| `$fsdbDumpMDA`  | 专门记录多维数组/存储器内容  | 深度、实例名、数组名 |

10. 