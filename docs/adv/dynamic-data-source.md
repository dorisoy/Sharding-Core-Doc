---
icon: launch
title: 动态追加分库
category: 高级
---

## 动态分库已经支持但是目前还没有例子后续会增加文档和例子
<!-- 
## 背景
很多时候我们会有一个需求就是如何针对现有的路由进行动态的处理数据和追加新表，默认sharding-core提供的按时间分表都已经提供了该技术，保证按时间分表的路由会在程序正确运行的前提下正确的动态添加分表、分库并且创建对应的分表、分库。

## 解析按时间分表

### 路由分析
我们这边为每个分表对象都需要创建一个分表路由，这个分表的虚拟路由除了告诉框架如何正确的crud外还提供了一个通用的属性就是在程序启动时会返回目前现有数据库的所有表后缀。

```csharp

    public abstract class AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute<TEntity> : AbstractShardingTimeKeyDateTimeVirtualTableRoute<TEntity> where TEntity : class
    {
        public abstract DateTime GetBeginTime();
        public override List<string> GetAllTails()
        {
            var beginTime = ShardingCoreHelper.GetCurrentMonthFirstDay(GetBeginTime());
         
            var tails=new List<string>();
            //提前创建表
            var nowTimeStamp =ShardingCoreHelper.GetCurrentMonthFirstDay(DateTime.Now);
            if (beginTime > nowTimeStamp)
                throw new ArgumentException("begin time error");
            var currentTimeStamp = beginTime;
            while (currentTimeStamp <= nowTimeStamp)
            {
                var tail = ShardingKeyToTail(currentTimeStamp);
                tails.Add(tail);
                currentTimeStamp = ShardingCoreHelper.GetNextMonthFirstDay(currentTimeStamp);
            }
            return tails;
        }
    }
```
首先上述代码是一个简单的按时间分表按月分，这边我只列出了两个方法相对动态添加比较重要，第一个是`GetBeginTime`，这个方法要求返回一个时间这个时间用于后续的`GetAllTails`.
我们接着来看`GetAllTails`内部是获取`GetBeginTime`值然后计算出这个之间的当前月份的第一天，然后再对当前时间进行计算算出当前时间月份的第一天，那么后续进行两个值相差的每个月就是系统中这张表按时间分表的所有后缀.
`GetAllTails`仅在启动时被调用一次后续,用于启动时判断，后续如果需要获取可以通过`IVirtualTableManager<TShardingDbContext>` 获取对应的所有的表后缀`virtualTableManager.GetVirtualTable(entityType).GetTableAllTails()`

::: warning 注意
!!!`GetAllTails`仅在启动时被调用一次后续,用于启动时判断!!!
!!!`GetAllTails`仅在启动时被调用一次后续,用于启动时判断!!!
!!!`GetAllTails`仅在启动时被调用一次后续,用于启动时判断!!!
:::
### 建表的分析

```csharp
        public Task ExecuteAsync()
        {
            var virtualTableManager = (IVirtualTableManager)ShardingContainer.GetService(typeof(IVirtualTableManager<>).GetGenericType0(EntityMetadata.ShardingDbContextType));
            var virtualTable = virtualTableManager.GetVirtualTable(typeof(TEntity));
            _logger.LogDebug($"get {typeof(TEntity).Name}'s virtualTable ");
            if (virtualTable == null)
            {
                _logger.LogDebug($" {typeof(TEntity).Name}'s virtualTable  is null");
                return Task.CompletedTask;
            }
            var entityMetadataManager = (IEntityMetadataManager)ShardingContainer.GetService(typeof(IEntityMetadataManager<>).GetGenericType0(EntityMetadata.ShardingDbContextType));
            var virtualDataSource = (IVirtualDataSource)ShardingContainer.GetService(typeof(IVirtualDataSource<>).GetGenericType0(EntityMetadata.ShardingDbContextType));
            var tableCreator = (IShardingTableCreator)ShardingContainer.GetService(typeof(IShardingTableCreator<>).GetGenericType0(EntityMetadata.ShardingDbContextType));
            var now = DateTime.Now.AddMinutes(10);
            var tail = virtualTable.GetVirtualRoute().ShardingKeyToTail(now);
            ISet<string> dataSources = new HashSet<string>();
            if (entityMetadataManager.IsShardingDataSource(typeof(TEntity)))
            {
                var virtualDataSourceRoute = virtualDataSource.GetRoute(typeof(TEntity));
                foreach (var dataSourceName in virtualDataSourceRoute.GetAllDataSourceNames())
                {
                    dataSources.Add(dataSourceName);
                }
            }
            else
            {
                dataSources.Add(virtualDataSource.DefaultDataSourceName);
            }
            _logger.LogInformation($"auto create table data source names:[{string.Join(",", dataSources)}]");
            foreach (var dataSource in dataSources)
            {
                try
                {
                    _logger.LogInformation($"begin table tail:[{tail}],entity:[{typeof(TEntity).Name}]");
                    tableCreator.CreateTable(dataSource, typeof(TEntity), tail);
                    _logger.LogInformation($"succeed table tail:[{tail}],entity:[{typeof(TEntity).Name}]");
                }
                catch (Exception e)
                {
                    //ignore
                    _logger.LogInformation($"warning table tail:[{tail}],entity:[{typeof(TEntity).Name}]");
                    if (ShowErrorLog)
                        _logger.LogError(e, $"{dataSource} {typeof(TEntity).Name}'s create table error ");
                }
            }
            virtualTableManager.AddPhysicTable(virtualTable, new DefaultPhysicTable(virtualTable, tail));

            return Task.CompletedTask;
        }
```
代码取自按月分表自动建表任务的代码，当然如果是您自己有定时作业可以完全通过泛型方法的依赖注入获取而不需要反射+强转来实现。

`IVirtualTableManager<TShardingDbContext>` 拥有动态添加物理表的功能`AddPhysicTable`,来保证程序知道目前有多少个该表的后缀

`IEntityMetadataManager<TShardingDbContext>` 用来判断对应表是否为分表还是分库

`IVirtualDataSource<TShardingDbContext>` 用来获取对应的数据源名称

`IShardingTableCreator<TShardingDbContext>`用来实现表创建

**注意：**因为数据库可能已经创建了对应的表。所以后续的调用会导致表创建抛出异常，这边在无论是否创建成功后都选择将物理表添加到对应的虚拟表里面，并且`virtualTableManager.AddPhysicTable`已经做好了无法重复添加的校验

**结论：**动态添加表需要满足对应表路由能够正确返回对应目前的数据库表后缀全部数目，在创建对应的数据库表外，还需要对分表对象的`IVirtualTable`进行追加物理表使框架可以明确知道有这么一张表，并且需要考虑是否需要动态分表路由逻辑，当表后缀有新的添加之后那么是否对应的路由逻辑需要改变呢，比如我们是按租户Id来分表的那么新增后不需要修改路由逻辑，如果我们是取模的那么就需要考虑这个问题,并且需要考虑数据迁移，需要注意下次启动的时候会不会将之前添加的动态表添加进来呢?`GetAllTails`会不会在下次程序启动的时候不返回本次动态添加的呢


::: warning 注意
!!!框架仅提供分表分库路由不提供数据迁移,数据迁移需要手动实现!!!
!!!框架仅提供分表分库路由不提供数据迁移,数据迁移需要手动实现!!!
!!!框架仅提供分表分库路由不提供数据迁移,数据迁移需要手动实现!!!
::: -->