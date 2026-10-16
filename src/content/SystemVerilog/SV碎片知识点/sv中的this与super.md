---
title: sv中的this与super
date: 2026-07-15
updated: 2026-09-02
tags:
  - systemverilog
  - this
  - super
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---
### this

``` systemverilog
class Transaction;
logic [31:0] addr;
logic kind;
logic [63:0] data;

function new(logic [31:0] addr);
	this.addr = addr;
	this.kind = 'x;
	this.data = 'x;
endfunction

function void display();
	$display("addr=%h, kind=%b, data=%h",addr, kind, data);
endfunction

endclass
```

#### 1. 第一段 `function new(...)` 的用法是什么？

这段 `function new` 是**类的构造函数（Constructor）**。

- **作用**：它是在创建 `Transaction` 类的对象实例时，**自动被调用**的特殊函数。
- **目的**：用于对对象内部的成员变量（`addr`、`kind`、`data`）进行**初始化和赋初值**。
- **调用时机**：当你执行 `trans = new(32'h1000);` 时，这个函数就会执行，将传入的地址赋值给对象。

值得注意的是，在SystemVerilog中，构造函数的名字**固定为 `new`**，并且它**不能有返回值**（隐式返回对象的句柄）。

---

#### 2. 为什么赋值时需要用 `this.`？

核心原因是：**构造函数的局部变量名字 `addr` 和类变量名字 `addr` 重名了**。

在函数内部，`addr` 这个标识符优先指向**函数自己的局部形参**。如果直接写：

```systemverilog
addr = addr;  // 错误！这是把形参 addr 赋值给形参 addr 自己
```

编译器无法区分左边的 `addr` 是想表示“成员变量”还是“局部形参”，因此这种写法**不会修改**类成员变量 `this.addr`，而是在做毫无意义的自我赋值。

**`this.` 的作用**：

- `this` 是一个隐式的句柄，指向**当前正在被构造的对象实例**，即**引用类一级变量**。
- `this.addr` 明确告诉编译器：我要操作的是**这个对象的成员变量** `addr`。
- 等号右边的 `addr` 因为没有 `this.`，所以被解析为**函数传入的形参**。

所以这条语句的真正含义是：
> “把传入的形参 `addr` 的值，赋给当前对象的成员变量 `addr`。”

---

#### 补充解释代码中的细节

```systemverilog
this.kind = 'x;
this.data = 'x;
```

- 虽然 `kind` 和 `data` 并没有和形参重名，理论上可以不写 `this.` 直接写 `kind = 'x;`。
- 但这里**加上 `this.`** 是极好的编程习惯，它让读代码的人一眼就能看出你在初始化**对象的成员变量**，而不是某个局部变量，提高了代码的可读性和安全性。

---

#### 举个实例化调用的例子

当你写如下测试代码时：

```systemverilog
Transaction t;
t = new(32'hA5F0);
t.display();
```

- `new(32'hA5F0)` 触发构造函数，`this.addr = addr` 使得 `t.addr` 变成 `32'hA5F0`，同时 `kind` 和 `data` 被填充为 `x`（未知态）。
- 调用 `display()` 会打印出：`addr=a5f0, kind=x, data=xxxxxxxxxxxxxxxx`

---

#### 一个避免使用 `this` 的替代写法

如果你不想写 `this.`，可以把形参名字改得不一样，比如：

```systemverilog
function new(logic [31:0] addr_in);
    addr = addr_in;  // 没有歧义，不需要 this
    kind = 'x;
    data = 'x;
endfunction
```

但在实际的大型项目中，为了让代码风格统一、自文档化，使用 `this.` 来强调成员变量是非常普遍且推荐的做法。

### super

1. **用途**：引用父类的成员（变量或方法）；
2. 使用场景：
	- 当子类重写父类方法时，调用父类的原始方法；
	- 访问父类中被隐藏的成员变量；
	- 在子类构造函数中调用父类构造函数。

``` systemverilog
class fu;
	int a = 1;
	virtual function void display();
		$display("fu is %0d",a);
	endfunction
endclass

class zi extends fu;
	int a = 2;
	function void display();
		super.display(); //这会调用父类的方法
		$display("fu in zi is %0d",super.a); //访问父类的成员变量
		$display("zi is %0d",super.a); //访问子类的成员变量
	endfunction
endclass
```

将会输出

``` 
fu is 1
fu in zi is 1
zi is 2
```

--- 
this多用于类的内部，而super有着父类和子类的关系，用于类的继承。
