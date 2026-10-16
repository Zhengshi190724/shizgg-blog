---
title: IC笔面试之FIFO
date: 2026-08-27
tags:
  - Verilog
  - IC
  - FIFO
category: 技术
featured: "false"
draft: "false"
excerpt: IC/FPGA笔面试准备！
---
## FIFO(First In First Out)

### Sync_FIFO（同步FIFO）

#### 基本原理

- 性质与结构特点
	- 归根结底都是一个**具存储数据功能的数据存储器**。
	- 存储特点：
		- **先入先出**的队列：数据输入顺序和数据输出顺序一致；
		- **无需地址**确定位置：区分ROM和RAM；
		- 存在**读写**两个通道：外部数据通过写入通道写入FIFO，读取通道将内部数据读出FIFO
	- 分类：
		- **同步**(Sync)FIFO：读写两个通道使用同一个时钟，整个FIFO在同一个时钟域进行数据处理与信号运算；
		- **异步**(Async)FIFO：读写两个通道使用不同时钟，存在两个时钟域，需要进行跨时钟域处理（CDC）。
- FIFO容量大小最主要参数
	- 单位数据位宽：如下图Data Width为32，即每次读写数据的位宽最高位32bit；
	- 数据存储深度：如下图Data Depth为8，即FIFO最多可以存储8个32bit数据。
- FIFO中没有数据：empty拉**高**，**无法**从FIFO中**读取**数据；
- FIFO存满8个32bit数据：full拉**高**，**无法**向FIFO中**写入**数据。
- 7个端口：时钟clk；读写使能Ren、Wen；读写数据Rdata、Wdata；空满标志位
![同步FIFO结构图|486](../../../../public/images/posts/sv_learning_note/同步FIFO结构图.png "同步FIFO结构图)
-  读写操作（先入先出）
	- 写数据：空位置从深度最低向高处依次写入，写满full立马拉高；
	- 读数据：每次将深度最低位数据读出，高位数据自动向低位补全；读空empty立马拉高；

#### 时序

##### FIFO写时序

![FIFO写时序](../../../../public/images/posts/sv_learning_note/FIFO写时序.png "FIFO写时序)

- `wr_en`信号拉高，将`din`数据写入FIFO
- FIFO数据写满，`full`拉高，若在`full`为高电平的时候继续向FIFO中写入数据，则会导致FIFO溢出，`overflow`则会拉高进行提示。

##### FIFO读时序

**标准模式（standard mode）**

![FIFO读时序（标准模式）](../../../../public/images/posts/sv_learning_note/FIFO标准读时序.png "FIFO读时序（标准模式)

- Standard模式下，当检测到`rd_en`信号为高电平的时候，下一个周期`dout`信号才会从FIFO中输出。
- 从时序上看，`dout`会**滞后**`rd_en`一个周期。
- `empty`在`dout`输出最后一个数据时就拉高！

**FWFT模式（Xilinx/AMD术语）/ahead模式（Intel/Altera术语）**

![FIFO读时序（FWFT模式）](../../../../public/images/posts/sv_learning_note/FIFO_FWFT读时序.png "FIFO读时序（FWFT模式）)

- 这种读取模式下，默认`dout`可以不需要`rd_en`的允许直接输出FIFO的第一个数据，当检测到FIFO的读取使能信号`rd_en`之后，会切换到输出第二个信号，输出数据会比标准的数据提前一个时钟周期。
- 该模式时序就类似写操作的时序。

#### 代码设计思路

1、FIFO中写个RAM存储器协作存储
``` verilog
reg [DATA_WIDTH-1:0] mem_ram [DATA_DEPTN-1];
```
2、定义位宽计算的函数
- 以深度为8为例，需要地址0~7表示，而最大值7需要3bit位宽即可
``` verilog
function integer clog2(input integer data);
begin
	for(clog2 = 0; data > 0 ;clog2 = clog2 + 1)
		data = data >> 1;
end
endfunction
//...
//定义读写指针,即给每个深度定义一个编号
reg [clog2(DATA_DEPTH-1)-1:0] r_wr_ptr; //[7-1:0] 0-127,能表示所有地址即可
reg [clog2(DATA_DEPTH-1)-1:0] r_wr_ptr; //[7-1:0] 0-127,能表示所有地址即可
reg [clog2(DATA_DEPTH-1)  :0] r_fifo_number; //[7:0] 1-128,需要可以表示1-128的数据深度
```
3、写入数据，`wr_ptr`指针+1；读取数据，`rd_ptr`指针+1；当`wr_ptr[2:0]=3'b111`的时候+1会变成`wr_ptr[2:0]=3'b000`，`rd_ptr`也是一样；当`wr_ptr[2:0]==rd_ptr[2:0]`的时候是无法判断FIFO空满；
4、判断空满的方法：
1. 本次代码将使用中间变量`r_fifo_number`信号来计算FIFO内数据，再间接给出空满信号条件；
2. 也可以拓展1bit地址为，例：8个存储空间对应8个地址对应3bit地址，使用4bit变量来存储这3bit地址，再通过读写地址的最高位判断空满，最高位相同则为空，不同则为满。
3. **方法1只适用于同步FIFO，同一时钟域情况！而异步FIFO无法通过读写使能判断FIFO空满，只能用地址位扩展的方法。**
5、代码
- clog2函数
- 内嵌ram用以存储
- 读写指针，条件都为使能&&非空/满
- 读写数据操作
- fifo_number赋值
- 通过fifo_number来赋值空满信号
``` verilog
module sync_fifo #(
	parameter DATA_WIDTH = 8,
	parameter DATA_DEPTH = 128
)
(
	input wire                   i_sys_clk   ,
	input wire                   i_sys_rst_n ,
	input wire                   i_wren      ,
	input wire                   i_rden      ,
	input wire  [DATA_WIDTH-1:0] i_wdata     ,
	output wire [DATA_WIDTH-1:0] o_rdata     ,
	output wire                  o_full      ,
	output wire                  o_empty
);
//输入二级制数输出该数所占位宽
function integer clog2(input integer data);
begin
	for(clog2 = 0; data > 0 ;clog2 = clog2 + 1)
		data = data >> 1;
end
endfunction

reg [DATA_WIDTH-1:0] mem_ram [0:DATA_DEPTH-1];
reg [clog2(DATA_DEPTH-1)-1:0] r_wr_ptr;
reg [clog2(DATA_DEPTH-1)-1:0] r_rd_ptr;
reg [clog2(DATA_DEPTH-1)  :0] r_fifo_number;
//写指针递增
always@(posedge i_sys_clk or negedge i_sys_rst_n)begin
	if(!i_sys_rst_n) 
		r_wt_ptr <= 'd0;
	else if(i_wren && !o_full)
		r_wt_ptr <= r_wt_ptr + 1'b1;
	else
		r_wt_ptr <= r_wt_ptr;
end
//读指针递增
always@(posedge i_sys_clk or negedge i_sys_rst_n)begin
	if(!i_sys_rst_n) 
		r_rd_ptr <= 'd0;
	else if(i_rden && !o_empty)
		r_rd_ptr <= r_rd_ptr + 1'b1;
	else
		r_rd_ptr <= r_rd_ptr;
end
//读数据操作
reg [DATA_WIDTH-1:0] r_rdata;
always@(posedge i_sys_clk or negedge i_sys_rst_n)begin
	if(!i_sys_rst_n) 
		r_rdata <= 'd0;
	else if(i_rden && !o_empty)
		r_rdata <= mem_ram[r_rd_ptr];
end
//内部mem复位以及写数据操作
integer i;
always@(posedge i_sys_clk or negedge i_sys_rst_n)begin
	if(!i_sys_rst_n) begin
		for(i = 0;i < DATA_DEPTH;i = i + 1) begin
			mem_ram[i] <= 'd0;
		end
	end
	else if(i_wren && !o_full)
		mem_ram[r_wt_ptr] <= i_wdata;
end
//fifo number cnt
always@(posedge i_sys_clk or negedge i_sys_rst_n)begin
	if(!i_sys_rst_n) begin
		r_fifo_number <= 'd0;
	else if(i_wren && i_rden && !o_full && !o_empty)
		r_fifo_number <= r_fifo_number;
	else if(i_wren && !i_rden && !o_full)
		r_fifo_number <= r_fifo_number + 1'b1; //写操作，fifo内部数据加一
	else if(!i_wren && i_rden && !o_empty)
		r_fifo_number <= r_fifo_number - 1'b1; //读操作，fifo内部数据减一
	else
		r_fifo_number <= r_fifo_number;
end

assign o_rdata = r_rdata;
assign o_full = (r_fifo_number == DATA_DEPTH);
assign o_full = (r_fifo_number == 4'd0);
```
6、TB代码片段
``` verilog
task Gen_wr_fifo;
	input [DATA_WIDTH-1:0] wr_data;
	begin
		wren = 1 ;
		wdata = wr_data;
		#(~CLK_PERILOD);
	end
endtask


task Gen_rd_fifo;
	begin 
		rden = 1;
		#(^CLK_PERILOD);
	end
endtask
initial begin
	wren = 0; wdata = 0; rden = 0;
	repeat(30) @(posedge i_sys_clk);
	#1;
	for(i=10;i<100;i=i+1) begin Gen_wr_fifo(i);end
	wren = 0;
	repeat(30) @(posedge i_sys_clk);
	#1；
	rden = 1;
	for(i=100;i<1000;i=i+1) begin Gen_wr_fifo(i);end
	rden = 0;
	wren = 0;
	repeat(30) @(posedge i_sys_clk);
	#1;
	repeat(30)Gen_rd_fifo();
	rden = 0;
	repeat(100) @(posedge i_sys_clk);
	$finish();
end

```

### Async_FIFO（异步FIFO）
#### 基本原理

FIFO相关的基本原理同Sync_FIFO不变，而不同的是：对于异步FIFO，读写指针处于不同的读写时钟域，因此存在读/写指针地址相互跨时钟域传递的问题；且读写地址都属于依次增加1的连续多bit数据，因此实际上非常适合多bit信号的跨时钟域传输方式——格雷码+同步。

#### 基本结构

1. 第1部分是双口RAM，用于数据的存储；
2. 第2部分是数据写入控制器；
3. 第3部分是数据读取控制器；
4. 读指针同步器：使用写时钟的两级触发器采集读指针，输出到数据写入控制器。
5. 写指针同步器：使用读时钟的两级触发器采集写指针，输出到数据读取控制器。

![异步FIFO结构图](../../../../public/images/posts/sv_learning_note/异步FIFO结构图.png "异步FIFO结构图)

#### 代码

1. 产生读写**二进制**地址；
2. 读写格雷码指针输出；
3. 指针的跨时钟域处理；
4. 空满条件的判断.

``` verilog
module async_fifo #(
	parameter DEPTH = 64 ,
	parameter WIDTH = 16
)(
	//wr
	input               i_wclk        ,
	input               i_wrstn       ,
	input               i_wren        ,
	input  [WIDTH-1:0]  i_wdata       ,
	//rd
	input               i_rclk        ,
	input               i_rrstn       ,
	input               i_rden        ,
	output [WIHTH-1:0]  o_rdata       ,
	//
	output              o_full        ,
	output              o_empty
);
//输入二级制数输出该数所占位宽
function integer clogb2(input integer data);
begin
	for(clogb2 = 0; data > 0 ;clogb2 = clogb2 + 1)
		data = data >> 1;
end
endfunction

reg [clogb2(DEPTH-1)   :0]    r_wrptr ;//[6:0]
reg [clogb2(DEPTH-1)   :0]    r_rdptr ;//[6:0]
wire[clogb2(DEPTH-1)-1 :0]    w_wraddr;//[5:0]
wire[clogb2(DEPTH-1)-1 :0]    w_rdaddr;//[5:0]

assign w_wraddr == r_wrptr[clogb2(DEPTH-1)-1 :0];
assign w_rdaddr == r_rdptr[clogb2(DEPTH-1)-1 :0];

always@(posedge i_wclk or negedge i_wrstn)begin
	if(!i_wrstn) 
		r_wrptr <= 'd0;
	else if(i_wren && !o_full)
		r_wrptr <= r_wrptr + 1'b1;
	else
		r_wrptr <= r_wrptr;
end

always@(posedge i_rclk or negedge i_rrstn)begin
	if(!i_rrstn) 
		r_rdptr <= 'd0;
	else if(i_rden && !o_empty)
		r_rdptr <= r_rdptr + 1'b1;
	else
		r_rdptr <= r_rdptr;
end
//二进制指针转换为格雷码指针
wire [clogb2(DEPTH-1)  :0]    w_wrptr_gray;
wire [clogb2(DEPTH-1)  :0]    w_rdptr_gray;

/* //原理
assign w_wrptr_gray[3] = r_wrptr[3];
assign w_wrptr_gray[2] = r_wrptr[2]^r_wrptr[3]; 
assign w_wrptr_gray[1] = r_wrptr[1]^r_wrptr[2]; 
assign w_wrptr_gray[0] = r_wrptr[0]^r_wrptr[1]; 
*/
assign w_wrptr_gray = r_wrptr ^ (r_wrptr>>1);
assign w_rdptr_gray = r_rdptr ^ (r_rdptr>>1);
//多bit CDC
reg [clogb2(DEPTH-1)  :0]    r_wrptr_gray_d0;
reg [clogb2(DEPTH-1)  :0]    r_wrptr_gray_d1;
//读时钟和复位同步写指针
always@(posedge i_rclk or negedge i_rrstn) begin
	if(!i_rrstn)begin
		r_wrptr_gray_d0 <= 'd0;
		r_wrptr_gray_d1 <= 'd0;
	else begin
		r_wrptr_gray_d0 <= w_wrptr_gray;
		r_wrptr_gray_d1 <= r_wrptr_gray_d0;
	end
end

reg [clogb2(DEPTH-1)  :0]    r_rdptr_gray_d0;
reg [clogb2(DEPTH-1)  :0]    r_rdptr_gray_d1;
//写时钟和写复位同步读指针
always@(posedge i_wclk or negedge i_wrstn) begin
	if(!i_wrstn)begin
		r_rdptr_gray_d0 <= 'd0;
		r_rdptr_gray_d1 <= 'd0;
	else begin
		r_rdptr_gray_d0 <= w_rdptr_gray;
		r_rdptr_gray_d1 <= r_rdptr_gray_d0;
	end
end
//在rd_clk下产生的信号，读完fifo才空，故空信号一定是要在原本的读指针下第一时间给出
assign o_empty =  (w_rdptr_gray == r_wrptr_gray_d1);//原读 === 打拍写
//在wr_clk下产的信号，格雷码比较前2bit按位取反+原先的后续bit位
assign o_full = (w_wrptr_gray == {~r_rdptr_gray_d1[clogb2(DEPTH-1):clogb2(DEPTH-1)-1],r_rdptr_gray_d1[clogb2(DEPTH-1)-2:0]});

ram #(
	.DATA_WIDTH(WIDTH),
	.DATA_DEPTH(DEPTH)
)
u_ram(
	.i_wrclk  (i_wclk           ),
	.i_wrstn  (i_wrstn          ),
	.i_wren   (~o_full && i_wren),
	.i_waddr  (w_wraddr         ),
	.i_wdata  (i_wdata          ),
	.i_rdclk  (i_rclk           ),
	.i_rdrstn (i_rrstn          ),
	.i_rden   (~o_empty&& i_rden),
	.i_raddr  (w_rdaddr         ),
	.o_rdata  (o_rdata          )
);
module ram #(
	parameter DATA_WIDTH = 8,
	parameter DATA_DEPTH = 64
)
(
	//wr
	input i_wrclk ,
	input i_wrstn ,
	input i_wren  ,
	input [clogb2(DATA_DEPTH-1)-1:0] i_waddr ,
	input [DATA_WIDTH-1          :0] i_wdata ,
	//rd
	input i_rdclk ,
	input i_rdrstn,
	input i_rden  ,
	input  [clogb2(DATA_DEPTH-1)-1:0] i_raddr ,
	output [DATA_WIDTH-1          :0] o_rdata
);
reg [DATA_WIDTH-1:0] dual_ram[0:DATA_DEPTH-1];
reg [DATA_WIDTH-1:0] r_rdata;
wire [DATA_WIDTH-1:0] test_dual_ram0;
wire [DATA_WIDTH-1:0] test_dual_ram127;
assign test_dual_ram0 = dual_ram[0];
assign test_dual_ram127 = dual_ram[127];
integer i ;
always @(posedge i_wrclk or negedge i_wrstn) begin
	if(!i_wrtsn)
		for(i=0 ; i<DATA_DEPTH ; i = i + 1)
			dual_ram[i] = 'd0;
	else if(i_wren)
		dual_ram[i_waddr] <= i_wdata ;
	else 
		dual_ram[i_waddr] <= dual_ram[i_waddr];
end
always @(posedge i_rdclk or negedge i_rdrstn) begin
	if(!i_rdrstn)
		r_rdata <= 'd0;
	else if (i_rden)
		r_rdata <= dual_ram[i_raddr];
	else
		r_rdata <= r_rdata;
end
assign o_rdata = r_rdata;

function integer clogb2(input integer data) begin
	for(clogb2 = 0; data > 0; clogb2 = clogb2 +1)
		data = data >> 1;
end
endfunction

endmodule
```

- 虚满（/虚空）：由于full信号由原本写指针和打拍后读指针产生，读指针的变化并不会立即改变full信号，故，当读操作进行完时，读指针此时改变，而full信号仍然使用上一个时钟的打拍读指针，会晚2个时钟发生变化，此时这两个时钟内：fifo实际已经读出一个数据，full仍拉高表示满，即为虚满！

``` verilog
module ram#(
	parameter DEPTH = 128,
	parameter WIDTH = 8
)
(
	//wr
	input i_wclk,
	input i_wrstn,
	input i_wren,
	input [clogb2(DEPTH-1)-1:0] i_wraddr,
	input [WIDTH-1:0] i_wrdata,
	//rd
	input i_rclk,
	input i_rrstn,
	input i_rden,
	input [clogb2(DEPTH-1)-1:0] i_rdaddr,
	output [WIDTN-1:0] o_rddata
);

function integer clogb2(input integer data);
	begin
		for(clogb2 = 0;data > 0; clogb2 = clogb2 + 1)
			data = data >> 1;
	end
endfunction
reg [DEPTH-1:0] mem_ram [0:DEPTH-1]
reg [WIDTN-1:0] r_rddata;

integer i;
always@(posedge i_wclk or negedge i_wrstn)begin
	if(!i_wrstn)begin
	for(i = 0; i < DEPTH; i = i+1)
		mem_ram[i] = 'd0;
	else if(i_wren)
		mem_ram[i_wraddr] <= i_wrdata;
	else
		mem_ram[i_wraddr] <= mem_ram[i_wraddr];
end
always@(posedge i_rclk or negedge i_rrstn)begin
	if(!i_rrstn)
		r_rddata <= 'd0;
	else if(i_rden)
		r_rddata <= mem_ram[i_rdaddr];
	else
		r_rddata <= r_rddata;
end
assign o_rddata = r_rddata;
endmodule
```