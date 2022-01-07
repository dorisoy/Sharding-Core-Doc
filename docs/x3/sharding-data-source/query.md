---
icon: mysql
title: 查询
category: 使用指南
---


## Demo
本次分库的demo源码：[EFCoreShardingDataSource](https://github.com/xuejmnet/sharding-core/tree/main/samples/Sample.SqlServerShardingDataSource)

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
[{"id":"1","name":"MyName1","area":"B"},{"id":"63","payer":"3","money":1271,"area":"A","orderStatus":4,"creationTime":"2021-03-05T03:03:03"},{"id":"3","payer":"3","money":2484,"area":"A","orderStatus":4,"creationTime":"2021-01-04T03:03:03"},[{"id":"1","name":"MyName1","area":"B"},{"id":"6","name":"MyName6","area":"A"}]]
```
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [s].[Id], [s].[Area], [s].[Name]
      FROM [SysUser] AS [s]
      WHERE [s].[Id] = '1'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [s].[Id], [s].[Area], [s].[Name]
      FROM [SysUser] AS [s]
      WHERE [s].[Id] = '1'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (8ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [s].[Id], [s].[Area], [s].[Name]
      FROM [SysUser] AS [s]
      WHERE [s].[Id] = '1'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (3ms) [Parameters=[@__dateTime_0='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order] AS [o]
      WHERE [o].[CreationTime] >= @__dateTime_0
      ORDER BY [o].[CreationTime]
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(1) [o].[Id], [o].[Area], [o].[CreationTime], [o].[Money], [o].[OrderStatus], [o].[Payer]
      FROM [Order] AS [o]
      WHERE [o].[Id] = '3'
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Area], [s].[Name]
      FROM [SysUser] AS [s]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Area], [s].[Name]
      FROM [SysUser] AS [s]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Area], [s].[Name]
      FROM [SysUser] AS [s]
      WHERE [s].[Id] IN ('1', '6')
```

## join


### 分库join分库
1. 无索引
```csharp
        public async Task<IActionResult> QueryJoin()
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
      Executed DbCommand (3ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (3ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6')
```

2. 有索引`Area`就是索引
```csharp

        public async Task<IActionResult> QueryJoin2()
        {
            var begin = new DateTime(2021, 3, 2);
            var end = new DateTime(2021, 4, 3);
            var sql1 = from user in _myDbContext.Set<SysUser>().Where(o => (o.Id == "1" || o.Id == "6")&&o.Area=="A")
                join order in _myDbContext.Set<Order>().Where(o => o.CreationTime >= begin && o.CreationTime <= end)
                    on user.Id equals order.Payer
                select new
                {
                    user.Id,
                    user.Name,
                    user.Area,
                    OrderId = order.Id,
                    order.Payer,
                    order.CreationTime
                };
            return Ok(await sql1.ToListAsync());
        }
```
```json
[{"id":"6","name":"MyName6","area":"A","orderId":"66","payer":"6","creationTime":"2021-03-08T03:03:03"}]
```
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (17ms) [Parameters=[@__begin_0='?' (DbType = DateTime2), @__end_1='?' (DbType = DateTime2)], CommandType='Text', CommandTimeout='30']
      SELECT [s].[Id], [s].[Name], [s].[Area], [t].[Id] AS [OrderId], [t].[Payer], [t].[CreationTime]
      FROM [SysUser] AS [s]
      INNER JOIN (
          SELECT [o].[Id], [o].[CreationTime], [o].[Payer]
          FROM [Order] AS [o]
          WHERE ([o].[CreationTime] >= @__begin_0) AND ([o].[CreationTime] <= @__end_1)
      ) AS [t] ON [s].[Id] = [t].[Payer]
      WHERE [s].[Id] IN ('1', '6') AND ([s].[Area] = 'A')
```
::: warning 注意
1. 如果本次查询涉及`跨表`或者`跨库`并且查询附带`order by`那么order by的字段必须包含在返回结果里面.(聚合函数除外：count,any,sum......)
2. 应该尽可能避免分库join分库,如果实在需要join那么也应该尽可能指定某一张表或者分表的数目尽可能小。(因为分表后如果a1,a2 join b1,b2那么就会有2个结果相互组合,路由结果越多性能越低，会生成各自datasourcename的交集(并不是和分表一样的笛卡尔积))
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


::: warning 注意
并不是说因为你的字段值是ABC所以我们需要将数据源定义成A、B、C,这边是因为方便通用,一般原则上我们定义为ds0,ds1,ds2，至于`Area`如何转成`ds0`,`ds1`,`ds2`那么就需要你自己去实现，比如你有一个[A..Z]的数组，数组下标就是对应的`ds`后面数字那么你就可以自己实现路由，并且还可以支持大于小于等于
:::