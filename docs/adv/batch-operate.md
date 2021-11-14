---
icon: launch
title: 批量操作
category: 高级
---

## 批处理
批处理时我们程序在运行时常用的技术,用于在大数据量时的高效性和便捷性

## efcore批量处理生态
efcore有着许许多多的批处理生态，目前我们熟知的有[`Z.EntityFramework.Plus.EFCore`](https://github.com/zzzprojects/EntityFramework-Plus)还有[`EFCore.BulkExtensions`](https://github.com/borisdj/EFCore.BulkExtensions)等等一些列的，虽然各个框架五花八门但是在支持方面`sharding-cor`e表示我都支持

## 使用
```c#
var list = new List<SysUserMod>();
            ///通过集合返回出对应的k-v归集通过事务开启
            var dbContexts = _defaultTableDbContext.BulkShardingEnumerable(list);
            //var dbContexts = _defaultTableDbContext.BulkShardingTableEnumerable(list); //if only sharding table
            
           
                    foreach (var dataSourceMap in dbContexts)
                    {
                        foreach (var tailMap in dataSourceMap.Value)
                        {
                            tailMap.Key.BulkInsert(tailMap.Value.ToList());
                            //tailMap.Key.BulkDelete(tailMap.Value.ToList());
                            //tailMap.Key.BulkUpdate(tailMap.Value.ToList());
                        }
                    }
                _defaultTableDbContext.SaveChanges();
            //or
            var dbContexts = _defaultTableDbContext.BulkShardingEnumerable(list);
            //var dbContexts = _defaultTableDbContext.BulkShardingTableEnumerable(list); //if only sharding table
            using (var tran = _defaultTableDbContext.Database.BeginTransaction())
            {
                    foreach (var dataSourceMap in dbContexts)
                    {
                        foreach (var tailMap in dataSourceMap.Value)
                        {
                            tailMap.Key.BulkInsert(tailMap.Value.ToList());
                            //tailMap.Key.BulkDelete(tailMap.Value.ToList());
                            //tailMap.Key.BulkUpdate(tailMap.Value.ToList());
                        }
                    }
                _defaultTableDbContext.SaveChanges();
                tran.Commit();
            }

```

`sharding_core`会将本次的所有对象都进行分组对应自己的数据源和自己的所在dbcontext内

如果你是按表达式来进行分表的话
```csharp

            var dbContexts = _defaultTableDbContext.BulkShardingExpression(o=>o.id=="123");
            var dbContexts = _defaultTableDbContext.BulkShardingTableExpression(o=>o.id=="123"); //if only sharding table

```
