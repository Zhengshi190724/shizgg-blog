---
title: SystemVerilog：function和task
date: 2026-07-29
updated: 2026-07-29
tags:
  - systemverilog
  - task
  - function
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---
在 SystemVerilog 中，`function`（函数）和 `task`（任务）都是用于封装可重用代码的子程序，但它们的设计目标和能力有本质区别。理解这些差异对于编写高效、正确的验证代码至关重要。

---

### 核心区别总结

| 特性       | `function`                         | `task`                              |
| -------- | ---------------------------------- | ----------------------------------- |
| **时间消耗** | **不能消耗仿真时间**（不能包含 `#`、`@`、`wait`）  | **可以消耗仿真时间**（可以等待时钟、延时、事件）          |
| **返回值**  | 至少有一个返回值（通过函数名或 `return`）          | 可以无返回值（`void` 类型），也可以有返回值           |
| **参数方向** | 默认 `input`（只能有 `input` 和 `output`） | 可以具有 `input`、`output`、`inout`、`ref` |
| **调用方式** | 在**表达式**中调用（如赋值、条件、打印）             | 作为**过程语句**调用（单独一行）                  |
| **同步阻塞** | 立即执行，不阻塞等待                         | 可以阻塞等待信号/事件                         |
| **典型用途** | 组合逻辑计算、数据转换、格式处理                   | 总线传输、配置序列、复杂协议时序                    |
| **综合能力** | 可综合（纯组合逻辑）                         | 通常不可综合（但用于验证）                       |

---

### 详细说明与示例

#### 1. 时间消耗 —— 最根本的区别
- **`function` 不消耗时间**：一个函数调用必须立即完成（在 0 仿真时间内），因此它内部不能包含 `#`、`@(posedge clk)`、`wait(...)` 等需要时间推进或阻塞等待的语句。
- **`task` 可以消耗时间**：任务中可以使用 `@(posedge clk)` 等待时钟边沿，用 `#5` 延迟，或 `wait(condition)` 等待信号变化。

```systemverilog
// 合法：函数，纯组合逻辑
function int adder(input int a, b);
    return a + b;
endfunction

// 合法：任务，有时序等待
task wait_for_ready();
    @(posedge clk iff ready);   // 等待时钟上升沿且 ready 为高
    $display("Ready received");
endtask

// 非法：函数不能等时钟
// function void bad(); @(posedge clk); endfunction  // 编译错误
```

#### 2. 返回值与参数
- **`function` 必定有返回值**：如果不希望有返回值，可以声明为 `function void`。但传统上，函数通过 `return` 或对与函数同名的变量赋值来返回结果。
- **`task` 可选返回值**：任务本身可以不返回任何值（`task` 或 `task void`），也可以像函数一样用 `return` 返回（SV 中任务也支持 `return`，但通常用于提前退出，不一定要返回值）。
- **参数方向限制**：函数只能用 `input` 和 `output`（通常不推荐 `output` 因为会引入副作用，更适合用 `return`）；任务支持所有参数方向，特别是 `ref`，用于引用外部变量，高效传递大数组。

```systemverilog
// 函数：返回 int
function int multiply(input int a, b);
    return a * b;
endfunction

// 任务：无返回值，通过 output 参数返回结果
task add_with_delay(input int a, b, output int result);
    #5;                 // 消耗时间
    result = a + b;
endtask

// 调用
int res;
multiply(3, 4);         // 作为表达式，但会忽略返回值（通常不这样写）
res = multiply(3, 4);   // 作为表达式赋值

add_with_delay(3, 4, res); // 作为过程语句调用
```

#### 3. 调用上下文
- **`function` 是表达式的一部分**：因为函数必须立即返回一个值，所以可以在 `$display`、赋值表达式、条件语句等任何需要表达式的地方调用。
- **`task` 是独立的语句**：任务调用不能作为表达式的一部分，因为它可能消耗时间，不能在一个时间步内完成并返回。

```systemverilog
int x;
// 函数用法
if (multiply(2,3) > 5)   // 合法：函数调用作为条件表达式
    $display("Greater");

// 任务用法
add_with_delay(5, 6, x);   // 合法：单独语句
// $display("Sum is %d", add_with_delay(5, 6, x));  // 非法！任务不能作为表达式
```

#### 4. 自递归与可重入
- 在 SystemVerilog 中，任务和函数都可以声明为 `automatic`，从而支持递归调用和可重入（并发安全）。但在 `module` 作用域中定义的任务/函数默认是 `static`（静态存储），不能递归，需要显式加 `automatic`。而 `class` 中定义的方法默认是 `automatic`。

```systemverilog
// 静态任务（默认），多次调用间局部变量共享，不安全
task static_task();    // 未加 automatic
    int cnt = 0;
    cnt++;
    $display(cnt);
endtask

// 自动任务，每次调用有独立存储
task automatic safe_task();
    int cnt = 0;        // 每次调用重新初始化
    cnt++;
    $display(cnt);
endtask
```

---

### 何时用 `function`，何时用 `task`？

- **任何不需要等待时钟/延迟的纯计算操作**，应该写成 `function`：数据计算、字符串处理、覆盖率计算、简单比较等。
- **需要与仿真时间交互的行为**，必须用 `task`：总线读写序列、复位序列、等待信号稳定、UVM 的 run_phase 等。
- **当需要返回多个结果时**，既可以使用 `task` 的多个 `output` 参数，也可以使用 `struct` 返回多个值（函数返回结构体），视复杂度而定。

---

### 一个综合示例

```systemverilog
class Transaction;
    rand bit [7:0] addr, data;
    function string display();
        return $sformatf("addr=%0h, data=%0h", addr, data);
    endfunction

    // 发送事务的任务（消耗时间）
    task send(virtual bus_if vif);
        @(posedge vif.clk);
        vif.addr <= addr;
        vif.data <= data;
        vif.valid <= 1;
        @(posedge vif.clk);
        vif.valid <= 0;
    endtask
endclass
```

函数 `display` 用于快速格式化打印，任务 `send` 则描述了带时钟的硬件交互过程。两者协同工作，构成了验证组件的基础。

---

### 一句话记忆
**`function` 是“纯组合计算”，立刻出结果；`task` 是“有时序的剧本”，可以等待和驱动信号。** 在写代码时，能不用时间就不用时间（优先函数），需要时间必须用任务。