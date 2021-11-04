---
icon: stack
title: 查询
category: 使用指南
---

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

::: warning 注意
如果本次查询涉及`跨表`或者`跨库`并且查询附带`order by`那么order by的字段必须包含在返回结果里面.(聚合函数除外：count,any,sum......)
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