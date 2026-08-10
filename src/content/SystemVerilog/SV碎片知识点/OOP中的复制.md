---
title: SystemVerilog 学习笔记（二）：数据类型
date: 2026-08-04
updated: 2026-08-04
tags:
  - systemverilog
  - 传递
  - 浅复制
  - 深复制
category: 技术
subcategory: SystemVerilog
featured: "false"
draft: "false"
excerpt: 从零开始的 SystemVerilog 学习笔记。
---

这是 **SystemVerilog OOP（面向对象）** 中非常重要的一个知识点，也是 UVM 中经常考察和使用的内容。很多初学者容易误认为

```systemverilog
pkt2 = pkt1;
```

是在复制对象，其实**它复制的是句柄（handle），而不是对象本身**。

理解深复制（Deep Copy）和浅复制（Shallow Copy）的关键，就是先理解 **对象和句柄** 的关系。

---

# 一、对象与句柄（Handle）

在 SystemVerilog 中

```systemverilog
Packet p1;
```

并没有创建对象。

它只是创建了一个**句柄（handle）**。

可以理解为 C++ 中的指针或者 Java 中的引用。

例如

```systemverilog
Packet p1;
```

内存中是

```
p1
 │
 ▼
 null
```

此时对象不存在。

只有

```systemverilog
p1 = new();
```

以后

```
        +----------------+
p1 ---->| Packet Object  |
        | data           |
        | addr           |
        +----------------+
```

对象才真正建立。

---

# 二、什么叫对象赋值

例如

```systemverilog
Packet p1;
Packet p2;

p1 = new();

p2 = p1;
```

很多初学者认为：

```
对象1 ----复制----> 对象2
```

实际上不是。

真正发生的是

```
          +----------------+
p1 ------>| Packet Object  |
          +----------------+
                ^
                |
p2 -------------+
```

**两个句柄指向同一个对象。**

没有创建第二个对象。

---

例如

```systemverilog
class Packet;

    int data;

endclass
```

测试

```systemverilog
module test;

    Packet p1,p2;

    initial begin

        p1 = new();
        p1.data = 10;

        p2 = p1;

        p2.data = 20;

        $display(p1.data);
        $display(p2.data);

    end

endmodule
```

输出

```
20
20
```

因为

```
p1
 \
  \
   ---> Object(data=20)
  /
 /
p2
```

只有一个对象。

---

# 三、浅复制（Shallow Copy）

浅复制：

> **复制对象本身，但是对象里面的句柄成员仍然共享。**

这是很多教材容易一句话带过的地方。

我们举一个真正有意义的例子。

---

假设有两个类

```systemverilog
class Address;

    int num;

endclass


class Packet;

    int id;

    Address addr;

endclass
```

Packet里面有

```
id
addr(handle)
```

注意

addr也是对象。

例如

```systemverilog
Packet p1;

p1 = new();

p1.addr = new();

p1.id = 10;
p1.addr.num = 100;
```

内存变成

```
        Packet
      +---------+
p1 -->| id=10   |
      | addr ---+------+
      +---------+      |
                       \|/
                 +-------------+
                 | Address     |
                 | num=100     |
                 +-------------+
```

现在做浅复制

```
Packet p2;

p2 = new();

p2.id = p1.id;

p2.addr = p1.addr;
```

结果

```
       Packet1                Packet2
      +---------+           +---------+
p1 -->| id=10   |           | id=10   |<--p2
      | addr ---+-----------+ addr    |
      +---------+           +---------+
             \                 /
              \               /
               +-------------+
               | Address     |
               | num=100     |
               +-------------+
```

Packet对象有两个。

但是

Address对象只有一个。

这就是浅复制。

---

如果

```systemverilog
p2.addr.num = 999;
```

结果

```systemverilog
$display(p1.addr.num);
```

输出

```
999
```

因为Address还是同一个。

---

# 四、深复制（Deep Copy）

深复制：

> 不仅复制Packet对象，还要把Packet里面所有对象重新new一份。

例如

```systemverilog
Packet p2;

p2 = new();

p2.id = p1.id;

p2.addr = new();

p2.addr.num = p1.addr.num;
```

此时内存

```
Packet1

+---------+
| id=10   |
| addr ---+------+
+---------+      |
                 \|/
           +-------------+
           |Address      |
           |num=100      |
           +-------------+

Packet2

+---------+
| id=10   |
| addr ---+------+
+---------+      |
                 \|/
           +-------------+
           |Address      |
           |num=100      |
           +-------------+
```

两个Address已经独立。

于是

```systemverilog
p2.addr.num = 888;
```

结果

```
p1.addr.num =100

p2.addr.num =888
```

互不影响。

---

# 五、SystemVerilog如何实现深复制

通常都会写一个copy函数。

例如

```systemverilog
class Address;

    int num;

    function Address copy();

        Address tmp;

        tmp = new();

        tmp.num = this.num;

        return tmp;

    endfunction

endclass
```

Packet

```systemverilog
class Packet;

    int id;

    Address addr;

    function Packet copy();

        Packet tmp;

        tmp = new();

        tmp.id = this.id;

        tmp.addr = this.addr.copy();

        return tmp;

    endfunction

endclass
```

于是

```systemverilog
Packet p2;

p2 = p1.copy();
```

就是真正意义上的深复制。

---

# 六、为什么UVM强调Deep Copy

UVM transaction里面经常有很多对象

例如

```
sequence_item

↓

packet

↓

header

↓

crc

↓

payload
```

结构如下

```
Packet

 ├── Header
 ├── CRC
 └── Payload
```

如果

```systemverilog
pkt2 = pkt1;
```

或者浅复制

那么Driver修改Payload以后

Monitor里面的数据也跟着变。

整个Scoreboard都会错。

所以UVM里面都有

```systemverilog
copy()
clone()
```

例如

```systemverilog
my_item item2;

item2 = item1.clone();
```

clone内部实际上就是

```
new()

↓

copy()
```

也就是深复制。

---

# 七、浅复制与深复制对比

|比较项|浅复制（Shallow Copy）|深复制（Deep Copy）|
|---|---|---|
|新建顶层对象|是|是|
|基本类型成员（int、bit等）|复制值|复制值|
|对象类型成员（class）|**复制句柄，共享对象**|**重新 `new` 并复制内容**|
|修改子对象是否影响原对象|会|不会|
|内存占用|小|较大|
|执行速度|快|稍慢|
|UVM 推荐|一般不用|**推荐，`copy()`/`clone()` 都属于深复制**|

---

## 一句话总结

可以把对象想象成一栋房子，句柄是房子的钥匙：

- **句柄赋值（`p2 = p1`）**：只是把钥匙复制了一把，两个人进入的是**同一栋房子**。
    
- **浅复制**：新建了一栋房子，但房子里的家具（成员对象）还是**共用原来的家具**。
    
- **深复制**：不仅新建了一栋房子，还把里面所有家具都重新买了一套，因此两栋房子完全独立。
    

这也是 UVM 中 `copy()` 和 `clone()` 要解决的核心问题：确保事务对象之间互不影响，避免因为共享子对象而产生难以定位的验证错误。