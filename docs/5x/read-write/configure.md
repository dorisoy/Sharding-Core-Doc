---
icon: launch
title: 读写分离
category: 读写分离
---

## 介绍
简单介绍下目前`ShardingCore`框架支持一主多从的读写分离架构,具体的数据库实现可以通过百度等搜索引擎查询具体的配置,sqlserver主要通过发布订阅 always on mysql主要通过bin log订阅伪装slave节点等

假设目前我们又两个数据源A，B这两个数据源分别拥有A有A1，A2两个从库，B拥有B1一个从库，那么假设在这种情况下我们应该如何进行配置呢

## 配置读写分离
```csharp
.AddReadWriteSeparation(sp =>
                {
                    return new Dictionary<string, IEnumerable<string>>()
                    {
                        {"A",new List<string>(){"Data Source=localhost;Initial Catalog=ShardingCoreDBA1;Integrated Security=True;","Data Source=localhost;Initial Catalog=ShardingCoreDBA2;Integrated Security=True;"}},
                        {"B",new List<string>(){"Data Source=localhost;Initial Catalog=ShardingCoreDBB1;Integrated Security=True;"}}
                    };
                },ReadStrategyEnum.Loop,defaultEnable:true,defaultPriority:10,ReadConnStringGetStrategyEnum.LatestFirstTime)
```
这样我们就配置好了针对A数据源从数据库A1，A2针对B数据源B1从库

## 参数说明

### ReadStrategyEnum

#### ReadStrategyEnum.Loop
表示同一个数据源的从库链接读取策略为轮询一个接一个公平读取,（可以设置同一个链接多次就是所谓的权重）

#### ReadStrategyEnum.Random
表示针对同一个数据源获取链接采用随机策略,（可以设置同一个链接多次就是所谓的权重）

### defaultEnable
表示是否默认读操作走读数据库true:表示默认读取查询操作走从库，false表示默认读取查询操作还是走主库

如果全局设置为true/false后想要修改当前dbcontext可以通过
```csharp
    //切换到从数据库
    _virtualDbContext.ReadWriteSeparationReadOnly();
    //切换到主数据库
    _virtualDbContext.ReadWriteSeparationWriteOnly();
```
以上两个扩展将无法作用于写入操作，写入操作永远只会走主库而非从库

除了通过dbcontext上的属性也支持通过scope创建
```csharp
            using (_shardingReadWriteManager.CreateScope<ShardingDefaultDbContext>())
            {
                _shardingReadWriteManager.GetCurrent<ShardingDefaultDbContext>().SetReadWriteSeparation(100, true);
                using (_shardingRouteManager.CreateScope())
                {
                    _shardingRouteManager.Current.TryCreateOrAddMustDataSource<Order>("A");
                    var areaB = await _virtualDbContext.Set<Order>().Where(o => o.Area == "B").FirstOrDefaultAsync();
                    Assert.NotNull(areaB);
                }
            }
```
被`_shardingReadWriteManager.CreateScope`包括的内部查询将使用对应的读写分离优先级和是否启用来判断，通过依赖注入`ServiceProvider.GetSerivce<IShardingReadWriteManager>()`来获取

### defaultPriority
表示默认的读写分离优先级，先判断优先级在判断高优先级是否启用来确定dbcontext是否启用读写分离

### ReadConnStringGetStrategyEnum

#### ReadConnStringGetStrategyEnum.LatestFirstTime
表示针对同一个dbcontext只取一次从库链接，保证同一个dbcontext下的从库链接都是一样的，不会出现说查询主表数据存在但是第二次查询可能走的是其他从库导致明细表不存在等问题，所以建议大部分情况下使用LatestFirstTime

#### ReadConnStringGetStrategyEnum.LatestEveryTime
表示每一次查询都是获取一次从库，但是可能会出现比如page的两次操作count+list结果和实际获取的不一致等情况，大部分情况下不会出现问题只是有可能会出现这种情况
