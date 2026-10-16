---
title: Driver和Monitor
date: 2026-09-06
tags:
  - Factory
  - Driver
  - Monitor
category: 技术
featured: "false"
draft: "false"
excerpt: UVM学习！
---
## Driver

数据流向图
![Driver数据流图.png|344](../../../../public/images/posts/sv_learning_note/Driver数据流图.png "Driver数据流图")

从sequencer流入的item通过driver发送到interface再流到DUT，方向。

方法：
1. `get_next_item(output REQ reg_arg);` blocking ：从序列中检索下一个可用项
2. `try_next_item(output REQ reg_arg);` blocking：若有可用项，则检索下一可用项
3. `item_done(RSP rsp_arg=null)` blocking：表示请求已成功发送至序列器

## Monitor

作用：
1. 监控端口信号，生成transaction；
2. check:协议、时序检查；
3. coverage:功能覆盖率收集；
4. information:调试信息；

