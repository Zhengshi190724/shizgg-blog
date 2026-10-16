---
title: factory机制
date: 2026-09-06
tags:
  - Factory
  - UVM
category: 技术
featured: "false"
draft: "false"
excerpt: UVM学习！
---
## 相关基本概念

- 基本概念：
	1. 封装 —— 隐藏实现细节，使得代码模块化
	2. 继承 —— 扩展已存在的代码模块
	3. 多态
		- 重写/覆盖（override）—— 子类重新定义父类的虚函数的做法；
		- 重载(overload) —— 允许存在多个同名函数，而这些函数的参数表不同；
- 工厂机制最大优势就是使得一个子类的指针以父类的类型传递时，其表现出的行为依然是子类的行为（function/task必须是virtual类型）；

## 工厂机制

- UVM工厂是允许用户通过任何继承的子类的对象来代替现有的类对象，以提高测试平台的灵活性和可扩展性的机制。
- 运用步骤：
```
1、类注册到工厂`uvm_object_utils()和`uvm_component_utils();
2、在例化前设置覆盖对象和类型(可选)set_type_override_by_type/ set_inst_override_by_type
3、创建对象 uvm_user_type..type_id:.create("");
```
- 应用：Top_tb中的`run_test("test_name” );//test name通过命令行UVM_TESTNAME参数传入重载了uvm_test`
- **Object没有层次化，Component有层次化**
### 注册

1. Object
``` systemverilog
`uvm_object_utils() 把一个直接或间接派生自uvm_object的class注册到factory
`uvm_object_param_utils() 把一个直接或间接派生自uvm_object的参数化的class注册到factory
例：class client_hub_seq_item #(
int unsigned CT_ADDR_WIDTH=`CT_ADDR_WIDTH,
int unsigned CT_DATA_WIDTH=`CT_DATA_WIDTH
) extends ivp_pkt;
```
2. Component
``` systemverilog
`uvm_component_utils()
`uvm_component_param_utils()
与object的类似
```

### 创建（类似声明句柄后的创建对象`tr=new()`）

1. 创建`uvm_`component对象：`comp_type::type_id::create(string name, uvm_component parent);` 
2. 创建`uvm_opject`对象：`comp_type::type_id::create(string name);` 
3. 【注】`::type_id::create`是固定写法，创建`component`比`object`需要多定义一个`uvm_component parent`！
1:12:32