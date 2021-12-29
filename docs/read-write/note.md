---
icon: launch
title: 注意事项
category: 读写分离
---

## 读写分离需要注意的事项
默认如果你的项目使用了读写分离,那么在efcore层面需要注意的问题有两点

### 追踪
是否需要追踪:这是一个很严肃的问题,使用读写分离并且开启读写分离的情况下查询都会走读库,并且读库的链接和写库的不一样那么自然而然的无法使用同一个dbconnection所以没有办法合理使用同一个dbcontext就没办法使用追踪
所以可以选择默认关闭使用读写分离,在需要时进行开启
```c#
.AddReadWriteSeparation(sp =>
                {
                    return new Dictionary<string, IEnumerable<string>>()
                    {
                        {
                            "A", new HashSet<string>()
                            {
                                "Data Source=localhost;Initial Catalog=ShardingCoreDBB;Integrated Security=True;"
                            }
                        }
                    };
                },ReadStrategyEnum.Loop,defaultEnable: false, readConnStringGetStrategy:ReadConnStringGetStrategyEnum.LatestEveryTime)
```
`defaultEnable`:表示默认创建的dbcontext是走的读库还是写库，如果你需要实现追踪那么可以先将这个值设置为false,然后再需要的时候通过如下代码来进行切换或者使用scope范围方式

```csharp
    //切换到从数据库
    _virtualDbContext.ReadWriteSeparationReadOnly();
    //切换到主数据库
    _virtualDbContext.ReadWriteSeparationWriteOnly();
```
或者通过实现中间件middleware或者actionfilter来实现范围
```csharp

            using (_shardingReadWriteManager.CreateScope<ShardingDefaultDbContext>())
            {
                //设置为走读写分离，100为默认的优先级如果你在配置的时候没有生效
                _shardingReadWriteManager.GetCurrent<ShardingDefaultDbContext>().SetReadWriteSeparation(100, true);
                    var areaB = await _virtualDbContext.Set<Order>().Where(o => o.Area == "B").FirstOrDefaultAsync();
            }
```