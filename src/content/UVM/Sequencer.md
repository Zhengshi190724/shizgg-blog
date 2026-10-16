---
title: Sequencer
date: 2026-09-06
tags:
  - Factory
  - Sequencer
category: 技术
featured: "false"
draft: "false"
excerpt: UVM学习！
---
**Sequencer功能**：产生激励，通过driver发送激励。

### 概念

- sequencer中有很多sequence，sequence中很多item，sequencer通过端口seq_item__export发出到driver的seq_item_port端口。
- 比喻：sequence item是一个子弹sequence是弹夹，它的作用是装子弹，而sequencer是一把枪，它的作用是把子弹射出去。
- 作用：
	- 将uvm_sequence中产生的激励传递给uvm_driver，也是一个参数类型，uvm_sequencer<RSP,REQ>，uvm_sequencer中的RSP与REQ要对应。
	- uvmsequencer充当激励环节的路由器的作用，即管理sequence，也传递数据，在某一个验证环境中，uvm_sequencer管理多个sequence，仲裁某一时刻传递哪个sequence的数据。
- `uvm_sequencer`:
	- `uvm_sequencer#(REQ,RSP)//带参数`
	- `default_sequence//默认的sequence`
	- `seq_item_export//组件间的端口`

### 使用

一、
1. `class gpio_sequencer extends uvm_sequencer #(gpio_transfer); ////定义gpio_sequencer扩展自uvm_sequencer，且指定其事务类型为gpio_transfer 
2.  ``` `uvm_component_utils(gpio_sequencer) //注册到工厂
3. `function new (string name, uvm_component parent);`
4. `super.new(name, parent);`
5. `endfunction :new //// 所有uvm_component 类的new()方法都需要name和parent 两个参数`
6. `endclass :gpio_sequencer`
二、`typedef uvm sequencer#(gpio_transfer) gpio_sequencer//不常用`

### Virtual sequencer

1. Virtual sequencer控制其他sequencer；
2. Virtual sequencer并不和任何driver相连；
3. Virtual sequencer本身不处理item；
4. 意思是Virtual sequencer只是通过直接连接sequencer间接处理item，且用于管理多个sequencer。
5. 场景：
	1. DUT的interface有两种端口：`erthernet`，`ahb`；
	2. 有两种sequencer分别产生不同类型seq_item；
	3. sequence再sequencer上启动，所以需要两种不同类型的sequencer；
	4. 两种不同类型的sequencer就需要Virtual sequencer来管理