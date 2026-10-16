---
title: IC笔试
date: 2026-09-07
tags:
  - 笔试
category: 技术
featured: "false"
draft: "false"
excerpt: 面试经历随笔！
---
### 线下笔试题

1. $Y =\overline{A\cdot C} \cdot \overline{A\cdot D}\cdot\overline{B\cdot C} \cdot \overline{B\cdot D}$ 将该不等式使用MOS管最少的形式表示出来。画出CMOS电路图。
	- 解答：化简可得 $Y =\overline{A\cdot B} + \overline{C\cdot D}$ =$\overline{{(A+B)} \cdot {(C+D)}}$
	- ![四输入或与非门|233](../../../../public/images/posts/sv_learning_note/四输入或与非门.png "四输入或与非门)
	- 非门
		- ![CMOS非门|186](../../../../public/images/posts/sv_learning_note/CMOS非门.png "CMOS非门)
	- 与非门
		- ![COMS与非门|186](../../../../public/images/posts/sv_learning_note/COMS与非门.png "COMS与非门)
	- 或非门
		- ![CMOS或非门|186](../../../../public/images/posts/sv_learning_note/CMOS或非门.png "CMOS或非门)
2. 自定义汇编指令，完成功能：判断寄存器R0的数值是否大于0xA4，若大于则像R7中写入0，否则写入非0；汇编指令有：①将某数值写入某中间寄存器REG；②将REG变量写入某寄存器R0~R7；③判断某寄存器某一位是否为1，为1则跳过；④判断某寄存器某一位是否为0，为0则跳过；⑤返回代码开头；
3. 两道波形图：①根据寄存器连接图画出波形；
4. ②根据波形写Verilog代码 —— 边沿信号din检测；输出为边沿数计数输出；
5. 代码修改题，没endmodule，时序逻辑用了阻塞赋值，敏感列表用了clk or rstn；
6. 同步复位与异步复位优缺点、使用场景：
	- 实现：
		- 同步复位：敏感列表没有`negedge rstn`，`if(!rstn)`为复位条件；
		- 异步复位：敏感列表有`negedge rstn`，`if(!rstn)`为复位条件；
	- 优缺点：
		- 优点：
			 - 同步复位：抗干扰能力强；STA容易；
			 - 异步复位：复位响应速度快；资源消耗小；最高频率高；无时钟依赖。
		- 缺点：
			- 同步复位：复位响应速度慢；资源消耗大；最高频率低；存在时钟依赖。
			- 异步复位：抗干扰能力弱；STA困难；
	- 使用场景：
		- 同步复位：**高速接口/严格时序路径**、**简单低速逻辑/教学**、**抗干扰要求极高的环境**；
		- 异步复位：**通用 FPGA/ASIC 设计**、**极低功耗/无时钟待机**、**跨时钟域 (CDC) 模块**；
	- 注：异步复位容易产生亚稳态；同步复位最大风险为时钟缺失；
	- 最好使用**异步复位，同步释放**：
``` verilog
// 复位同步器模块
module reset_sync(
	input wire clk,
	input wire rst_n_async, // 外部异步复位 
	output wire rst_n_sync // 内部同步释放后的复位 
); 
	reg [1:0] rst_ff; 
	always @(posedge clk or negedge rst_n_async) 
	begin if (!rst_n_async) rst_ff <= 2'b00; // 异步复位，立即清零 
	else rst_ff <= {rst_ff[0], 1'b1}; // 同步释放，移位寄存器打两拍 
	end 
	assign rst_n_sync = rst_ff[1]; 
	endmodule
```
7. DFF的内部结构电路图和时序约束；
![DFF电路结构图](../../../../public/images/posts/sv_learning_note/DFF电路结构图.png "DFF电路结构图)

- 结构如图：四个传输门和四个反相器，左边为主路径，右边从路径；
- 蓝线：
	- clock = 0，T1、T4导通，T2、T3截止，数据从A存入C点；
	- Tsetup：时钟上升沿来临前，数据从T1输入到C点的的时间为建立时间；
- 黄线：
	- clock = 1，T2、T3导通，T1、T4截止，数据从C流出到Q和Q_n；
	- Thd：传输门关断到打开，尤其是T1到T2的时间；
- clock再次跳转到0，数据锁存到从结构；
- Thd不满足，易容易引发亚稳态。
7. 建立时间保持时间时钟计算；
	- 几个参数定义：
		- Tclkx：时钟信号从起点到达源寄存器x时间；
		- Tco：D端到Q端的延迟，也叫Tcq等；
		- Tdata：数据传输加组合路径延迟；
		- Tskew：时钟偏移（Tclk2-Tclk1）；
		- Tperiod：一个时钟周期时间；
	- 建立时间Tsu：满足数据路径 < 时钟路径
		- `Tclk1 + Tco + Tdata + Tsu < Tperiod + Tclk2`/ `Tco + Tdata + Tsu < Tperiod + Tckew`
		- 建立时间裕量：`Tperiod + Tckew - Tco - Tdata - Tsu`
	- 保持时间Thd：满足数据路径 > 时钟路径
		- `Tclk1 + Tco + Tdata > Tclk2 + Thd`/`Tco + Tdata  < Thd + Tskew`
		- 保持时间裕量：同理，大减去小
	- 计算最大时钟频率即满足建立时间的最小Tperiod的倒数
8. CPU的带立即数的指令：（顺带复习RISC-V的指令集）
	- R型：`funct7[31:25] rs2[24:20] rs1[19:15] funct[14:12] rd[11:7] opcoode[6:0]`
		- 功能指令 源寄存器2 源寄存器1 操作指令 目的寄存器 操作码（无立即数）
		- `ADD SLT/SLTU(<) AND OR XOR SLL(<<) SRL(>>) SRA SUB(-)`
		- SRL为逻辑右移：高位补0；SRA为算数右移：高位补符号位；
	- I型：`imm[31:25] imm[24:20] rs1[19:15] funct3[14:12] rd[11:7] opcoode[6:0]`
		- 立即数高位 立即数低位  源寄存器1 功能码3 目的寄存器 操作码
		- `ADDI SLT/SLTIU(< imm) ANDI ORI XORI SLLI SRLI SRAI` 
		- `lw(加载字 —— 从内存中读取) lb lh`
	- S型：`imm[31:25] rs2[24:20] rs1[19:15] funct3[14:12] imm[11:7] opcoode[6:0]`
		- 立即数高位  源寄存器2  源寄存器1 功能码3 立即数低位 操作码
		- `sw(存储字32bit) sh(存储双字节) sb(存储单字节)`
	- B型：`imm[12]imm[10:5] rs2[24:20] rs1[19:15] funct[14:12] imm[4:1]imm[11]op`
		- 12bit立即数被打断成四份，其他位置同上
		- `beq(==) bne(!=) blt(<) bltu(unsigned<) bge(>=) bgeu(unsigned>=)`
	- U型：`imm[31:12] rd[11:7] opcode[6:0]`
		- 立即数 源寄存器 操作数
		- `lui auipc`
	- J型：`imm[20] imm[10:1] imm[11] imm[19:12] rd opcode`
	- 立即数打散**为了简化硬件多路选择器 (MUX) 的设计。** 将某些低位放置在特性位置，可以让**寄存器文件读取端口**和**立即数生成单元**共享更多的硬件线路。
9. 绘制CMOS逻辑电路：
	1. 将表达式化成$\overline{(A+B )\cdot ...\cdot (X+Y+Z)}$  与非型表达式
	2. 画下拉网络
		1. 画输出Y ---------------
		2. 画PMOS（有圆圈）作为上拉电阻：或门串联，与门并联（串联电路并起来）
		3. 画NMOS作为下拉电阻：或门并联，与门串联（并联网络串起来）
	3. MOS管：NMOS，箭头向栅极，需要栅极接高电平，使得电子形成沟道得以联通源极和漏极，导通电流由D指向S，寄生二极管由S指向D;

##  Chat篇

### Digital logic design

1. 组合逻辑与时序逻辑的区别是什么？各自包含哪些常见电路？
- 