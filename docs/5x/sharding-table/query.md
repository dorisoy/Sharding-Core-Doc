---
icon: stack
title: 查询
category: 使用指南
---

## Demo
本次分表的demo源码：[EFCoreShardingTable](https://github.com/xuejmnet/sharding-core/tree/main/samples/Sample.SqlServerShardingTable)

## 单对象简单查询

对`SysUser`和`Order`进行查询
```csharp
public async Task<IActionResult> Query()
        {
            var sysUser =await _myDbContext.Set<SysUser>().Where(o=>o.Id=="1").FirstOrDefaultAsync();
            var dateTime = new DateTime(2021,3,5);
            var order = await _myDbContext.Set<Order>().Where(o=>o.CreationTime>= dateTime).OrderBy(o=>o.CreationTime).FirstOrDefaultAsync();
            var orderIdOne = await _myDbContext.Set<Order>().FirstOrDefaultAsync(o => o.Id == "3");


            var sysUsers = await _myDbContext.Set<SysUser>().Where(o => o.Id == "1" || o.Id=="6").ToListAsync();

            return Ok(new object[]
            {
                sysUser,
                order,
                orderIdOne,
                sysUsers
            });
        }
```
结果
```json
[{"id":"1","name":"MyName1","area":"B","settingCode":"User"},{"id":"63","payer":"3","money":2407,"area":"A","orderStatus":4,"creationTime":"2021-03-05T03:03:03"},{"id":"3","payer":"3","money":974,"area":"A","orderStatus":4,"creationTime":"2021-01-04T03:03:03"},[{"id":"1","name":"MyName1","area":"B","settingCode":"User"},{"id":"6","name":"MyName6","area":"A","settingCode":"Admin"}]]
```
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [s].[Id], [s].[Area], [s].[Name], [s].[SettingCode]
      FROM [SysUser_01] AS [s]
      WHERE [s].[Id] = '1'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (6ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202111] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (25ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202105] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (21ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202104] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (13ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202106] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (9ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202107] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (11ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202109] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (23ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202108] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (5ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202103] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (47ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202110] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202110] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202109] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202105] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202108] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202107] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202111] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202102] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202101] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202106] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202104] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order_202103] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Area], [s].[Name], [s].[SettingCode]
      FROM [SysUser_01] AS [s]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Area], [s].[Name], [s].[SettingCode]
      FROM [SysUser_00] AS [s]
      WHERE [s].[Id] IN ('1', '6')
```

## join

### 分表join不分表
```csharp
        public async Task<IActionResult> QueryJoin1()
        {
           var sql= from user in _myDbContext.Set<SysUser>().Where(o => o.Id == "1" || o.Id == "6")
                join setting in _myDbContext.Set<Setting>()
                    on user.SettingCode equals setting.Code
                select new
                {
                    user.Id,
                    user.Name,
                    user.Area,
                    user.SettingCode,
                    SettingName=setting.Name,
                };
            return Ok(
              await sql.ToListAsync());
        }
```
结果
```json
[{"id":"1","name":"MyName1","area":"B","settingCode":"User","settingName":"UserName"},{"id":"6","name":"MyName6","area":"A","settingCode":"Admin","settingName":"AdminName"}]
```
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [s].[SettingCode], [s0].[Name] AS [SettingName]
      FROM [SysUser_00] AS [s]
      INNER JOIN [Setting] AS [s0] ON [s].[SettingCode] = [s0].[Code]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [s].[SettingCode], [s0].[Name] AS [SettingName]
      FROM [SysUser_01] AS [s]
      INNER JOIN [Setting] AS [s0] ON [s].[SettingCode] = [s0].[Code]
      WHERE [s].[Id] IN ('1', '6')
```

### 分表join分表

```csharp
        public async Task<IActionResult> QueryJoin2()
        {
           var begin = new DateTime(2021, 3, 2);
           var end = new DateTime(2021, 4, 3);
           var sql1 = from user in _myDbContext.Set<SysUser>().Where(o => o.Id == "1" || o.Id == "6")
               join order in _myDbContext.Set<Order>().Where(o=>o.CreationTime>=begin&&o.CreationTime<=end)
                   on user.Id equals order.Payer
               select new
               {
                   user.Id,
                   user.Name,
                   user.Area,
                   user.SettingCode,
                   OrderId = order.Id,
                   order.Payer,
                   order.CreationTime
               };
            return Ok(await sql1.ToListAsync());
        }
```
结果
```json
[{"id":"1","name":"MyName1","area":"B","settingCode":"User","orderId":"61","payer":"1","creationTime":"2021-03-03T03:03:03"},{"id":"1","name":"MyName1","area":"B","settingCode":"User","orderId":"71","payer":"1","creationTime":"2021-03-13T03:03:03"},{"id":"1","name":"MyName1","area":"B","settingCode":"User","orderId":"81","payer":"1","creationTime":"2021-03-23T03:03:03"},{"id":"1","name":"MyName1","area":"B","settingCode":"User","orderId":"91","payer":"1","creationTime":"2021-04-02T03:03:03"},{"id":"6","name":"MyName6","area":"A","settingCode":"Admin","orderId":"66","payer":"6","creationTime":"2021-03-08T03:03:03"},{"id":"6","name":"MyName6","area":"A","settingCode":"Admin","orderId":"76","payer":"6","creationTime":"2021-03-18T03:03:03"},{"id":"6","name":"MyName6","area":"A","settingCode":"Admin","orderId":"86","payer":"6","creationTime":"2021-03-28T03:03:03"}]
```
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (21ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [s].[SettingCode], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser_00] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order_202104] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (54ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [s].[SettingCode], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser_00] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order_202103] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (12ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [s].[SettingCode], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser_01] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order_202104] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (20ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [s].[SettingCode], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser_01] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order_202103] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
```

::: warning 注意
1. 如果本次查询涉及`跨表`或者`跨库`并且查询附带`order by`那么order by的字段必须包含在返回结果里面.(聚合函数除外：count,any,sum......)
2. 应该尽可能避免分表join分表,如果实在需要join那么也应该尽可能指定某一张表或者分表的数目尽可能小。(因为分表后如果a1,a2 join b1,b2那么就会有4个结果相互组合,路由结果越多性能越低，会生成笛卡尔积)
:::

### 查询接口支持
方法  | Method | [Unit Test](https://github.com/xuejmnet/sharding-core/blob/main/test/ShardingCore.Test50/ShardingTest.cs) 
--- |--- |--- 
第一条 |FindAsync |yes 
获取集合 |ToListAsync |yes 
第一条 |FirstOrDefaultAsync |yes 
最大 |MaxAsync |yes 
最小 |MinAsync |yes 
是否存在 |AnyAsync |yes 
数目 |CountAsync |yes 
数目 |LongCountAsync |yes 
求和 |SumAsync |yes 
平均 |AverageAsync |yes 
包含 |ContainsAsync |yes 
分组 |GroupByAsync |yes 