---
title: AHB_code
date: 2026-09-30
tags:
  - APB
category: 技术
featured: "false"
draft: "false"
excerpt: AHB总线手撕代码！
---
## Slave

### 整体结构框图

``` verilog
module ahb_sram(
	//System signal
	input          HCLK,
	input          HRESETn,
	//AHB Slaver interface
	input          HSEL,   //译码信号
	input          HWRITE, 
	input  [1:0 ]  HTRANS, //传输类型
	input  [2:0 ]  HSIZE,  //传输数据大小
	input  [2:0 ]  HBURST, //突发类型
	input  [31:0]  HADDR,
	input  [31:0]  HWDATA,
	
	output         HREADY,
	output [1:0 ]  HRESP,
	output [31:0]  HRDATA
);

localparam TRN_IDLE   = 2'b00;
localparam TRN_BUSY   = 2'b01;
localparam TRN_NONSEQ = 2'b10;
localparam TRN_SEQ    = 2'b11; 

reg [31:0] sram_mem [0:1023] ;

wire ahb_transfer_valid;
wire ahb_sram_idle;       //从机空闲信号， 有效则master能够对从机进行读写操作 
assign ahb_sram_idle = 1; //简易化，默认空闲
assign ahb_transfer_valid = HSEL && ahb_sram_idle && (HTRANS == TRN_NONSEQ || HTRANS == TRN_SEQ);

reg [9:0] sram_addr_r;
reg       sram_write_r;
reg       sram_active_r;
//写操作
always@(posedge HCLK or negedge HRESETn)begin
	if(!HRESETn)begin
		sram_addr_r   <= 10'b0;
		sram_write_r  <= 1'b0;
		sram_active_r <= 1'b0;
	end
	else if(ahb_transfer_valid)begin
		sram_addr_r   <= HADDR[11:2]; // 1bit地址对应1byte数据，每次传输32bit数据需要4个bit地址，故低2位(00 01 10 11) = 4个地址 总表示同一个32bit数据存储空间
		sram_write_r  <= HWRITE;
		sram_active_r <= 1'b1;
	end
	else begin
		sram_active_r <= 1'b0;
	end
end

always@(posedge HCLK)begin
	if(sram_active_r && sram_write_r)
		sram_mem[sram_addr_r] <= HWDATA;
end

assign HRDATA = (sram_active_r && !sram_write_r) ? sram_mem[sram_addr_r] : 32'h0;
assign HREADY = 1'b1;
assign HRESP = 2'b00;

endmodule
```

#### tb程序

仅展示重点的两个task函数代码编写和使用task函数代码

``` verilog
//AHB单次写任务（NONSEQ）
task ahb_write;
	input [31:0] addr;
	input [31:0] data;
	begin
		@(posedge HCLK);
		#1;            //模拟建立时间保持时间延迟。防止数据冒险
		HSEL   = 1'b1;
		HADDR  = addr;
		HTRANS = 2'b10;
		HWRITE = 1'b1;
		HSIZE  = 3'b010;
		@(posedge HCLK);  //等待一个周期的上升沿
		while (!HREADY) begin
			@(posedge HCLK); //模拟从机繁忙，持续等待
		end
		#1;                 //保证上面信号都持续1个时钟周期-1ns+1ns
		//进入数据阶段，提供数据，同时清空HTRANS
		HWDATA = data;
		HTRANS = 2'b00;
		HSEL = 1'b0;
	end
endtask
//AHB单次读任务（NONSEQ）
task ahb_read;
	input [31:0] addr;
	output [31:0] data;
	begin
		@(posedge HCLK);
		#1;            //模拟建立时间保持时间延迟。避免时钟沿竞争
		HSEL   = 1'b1;
		HADDR  = addr;
		HTRANS = 2'b10;
		HWRITE = 1'b0;
		HSIZE  = 3'b010;
		@(posedge HCLK);  //等待一个周期的上升沿
		while (!HREADY) begin
			@(posedge HCLK); //模拟从机繁忙，持续等待
		end
		#1;
		HTRANS = 2'b00;
		HSEL = 1'b0;  
		//在数据阶段结束时采样数据
		@(posedge HCLK)
		data = HRDATA;
	end
endtask

integer      i;
integer      error_cnt;
integer [31:0] rd_data;

initial begin
	//初始化信号
	HSEL    = 0;
	HADDR   = 0;
	HTRANS  = 0;
	HWRITE  = 0;
	HSIZE   = 0;
	HBURST  = 0;
	HWDATA  = 0;
	
	error_cnt = 0;
	
	//等待复位释放
	@(posedge HRESETn);
	repeat(5)@(posedge HCLK); //复位信号结束多延迟几个时钟周期再进行数据赋值
	$display("[TB INFO] ====== 开始向SRAM写入数据（地址0到1023）======");
	//循环写入数据，注意地址乘于 4 以满足字节寻址 (HADDR[11:2] 对应 0~1023)
 	for(i=0; i<1024; i=i+1)begin
	 	ahb_write(i*4,32'hAAAA_0000+i);
 	end
	repeat(5)@(posedge HCLK);
	
	$display("[TB INFO] ====== 开始从SRAM读取并比对数据 ======");
 	for(i=0; i<1024; i=i+1)begin
	 	ahb_read(i*4,rd_data);
	 	if(rd_data != (32'hAAAA_0000+i))begin
		 	$display("[TB ERROR] 地址 0x%0h 处地址不匹配！期望值为 0x%0h，实际值：0x%0h", i*4,(32'hAAAA_0000+i),rd_data);
		 	error_cnt = error_cnt + 1;
	 	end
 	end
 	//打印最终结果
	$display("----------------------------------------------");
	if (error_cnt == 0) begin
	$display(">>>>>> SUCCESS: 所有 1024个数据比对成功! <<<<<");
	end else begin
	$display(">>>>>> FAILURE: 共有 %0d 个数据错误!<<<<<<"，error_cnt)
	end
	$display("-----------------------------------------------");
	
	repeat(10)@(posedge HCLK);
	$finish;
end

```