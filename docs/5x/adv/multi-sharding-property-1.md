---
icon: launch
title: 多字段分片1
category: 高级
---

## 背景
什么情况下我们应该使用多字段分片(分表分库),就是如果你的这个对象在所对应的查询中不仅仅只有分片字段支持路由，并且其他字段也支持路由那么可以针对这个字段进行分片配置

举个栗子：这边我们订单量很大，所以我们选择按时间分表，每月一张表，分表字段是CreateTime，那么我们插入更新是很ok的，但是再查询方面会比较蛋疼，具体原因是我们明明是雪花id(或者顺序guid)明明主键可以解析出时间其实我们大概率也是可以得出具体表的
那么我们应该如何处理针对订单主键的查询呢，不好意思不支持，如果我们的订单id外还有一个字段是订单号，这个订单号也是可以具体路由到具体的分表那么我们该如何通过订单号查询快速定位呢，不好意思不支持，除非你带上订单时间，对于有洁癖的程序员这将是一个灾难性的。

基于上述场景sharding-core在x.3.2.x+的版本支持了多字段分表,具体实现原理就是插入，修改根据主分表字段进行处理，查询会根据主分表字段和额外分表字段进行处理取交集查询结果。
这样可以有效的帮助我们在分布式系统里面通过id进行数据交互而不需要额外附带任何字段信息。

## 实现
我们这边假设一个场景,订单id是long的雪花id，并且创建时间是datetime的订单表，我们针对这张表进行创建时间的分表，具体是按月分表。

### 创建订单
```csharp
//订单类
    public class MultiShardingOrder
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public DateTime CreateTime { get; set; }
    }
```
### 创建dbcontext
```csharp

//创建dbcontext

    public class MyDbContext:AbstractShardingDbContext,IShardingTableDbContext
    {
        public MyDbContext(DbContextOptions<MyDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<MultiShardingOrder>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.Id).ValueGeneratedNever();
                entity.Property(o=>o.Name).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.ToTable(nameof(MultiShardingOrder));
            });
        }
        /// <summary>
        /// empty impl
        /// </summary>
        public IRouteTail RouteTail { get; set; }
    }
```
### 创建路由
```csharp

//创建路由
public class MultiShardingOrderVirtualTableRoute:AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute<MultiShardingOrder>
    {
        public override void Configure(EntityMetadataTableBuilder<MultiShardingOrder> builder)
        {
            builder.ShardingProperty(o => o.CreateTime);
            builder.ShardingExtraProperty(o => o.Id);
        }

        public override Expression<Func<string, bool>> GetExtraRouteFilter(object shardingKey, ShardingOperatorEnum shardingOperator, string shardingPropertyName)
        {
            switch (shardingPropertyName)
            {
                case nameof(MultiShardingOrder.Id): return GetIdRouteFilter(shardingKey, shardingOperator);
                default: throw new NotImplementedException(shardingPropertyName);
            }
        }

        private Expression<Func<string, bool>> GetIdRouteFilter(object shardingKey,
            ShardingOperatorEnum shardingOperator)
        {
            //解析雪花id 需要考虑异常情况,传入的可能不是雪花id那么可以直接返回false因为是and链接所以直接就没有结果了//return tail => false;
            var analyzeIdToDateTime = SnowflakeId.AnalyzeIdToDateTime(Convert.ToInt64(shardingKey));
            //当前时间的tail
            var t = TimeFormatToTail(analyzeIdToDateTime);
            //因为是按月分表所以获取下个月的时间判断id是否是在灵界点创建的
            var nextMonthFirstDay = ShardingCoreHelper.GetNextMonthFirstDay(analyzeIdToDateTime);
            if (analyzeIdToDateTime.AddSeconds(10) > nextMonthFirstDay)
            {
                var nextT = TimeFormatToTail(nextMonthFirstDay);

                if (shardingOperator == ShardingOperatorEnum.Equal)
                {
                    return tail => tail == t||tail== nextT;
                }
            }
            var currentMonthFirstDay = ShardingCoreHelper.GetCurrentMonthFirstDay(analyzeIdToDateTime);
            if (analyzeIdToDateTime.AddSeconds(-10) < currentMonthFirstDay)
            {
                //上个月tail
                var nextT = TimeFormatToTail(analyzeIdToDateTime.AddSeconds(-10));

                if (shardingOperator == ShardingOperatorEnum.Equal)
                {
                    return tail => tail == t || tail == nextT;
                }
            }
            else
            {
                if (shardingOperator == ShardingOperatorEnum.Equal)
                {
                    return tail => tail == t;
                }
            }

            return tail => true;
        }

        public override bool AutoCreateTableByTime()
        {
            return true;
        }

        public override DateTime GetBeginTime()
        {
            return new DateTime(2021, 9, 1);
        }
    }
```

框架默认针对CreateTime的进行路由实现(前提是你是用的框架的默认路由),如果是自行实现路由还是一样需要实现`GetRouteToFilter(TKey shardingKey, ShardingOperatorEnum shardingOperator)`

`ShardingExtraProperty`额外分表字段(仅查询生效)

`GetExtraRouteFilter(object shardingKey, ShardingOperatorEnum shardingOperator, string shardingPropertyName)` 如果配置了额外字段并且本次查询会使用到那么`sharding-core`会将对应的分表字段进行通过这个方法,
默认抛出未实现路由,需要自行实现。这边我们将id雪花id进行了额外分表的处理,并且只处理了equal的方法如果你很厉害可以自行实现大于等于小于等于....

这边为什么不是简单的equal呢而是需要进行这么多的判断，其实因为是这样的，针对一个对象我们可能会进行如下操作
```csharp
var entity=new Entity()
//执行这边生成出来的id是2021-11-30 23:59:59.999.999
entity.Id="xxx";
//执行这边生成出来的时间是2021-12-01 00:00:00.000.000
entity.CreateTime=DateTime.Now;
```
那么数据是会被插入到202112这张表,但是如果你只是解析雪花id那么解析出来的是202111这张表,后续会出现数据无法命中的bug,所以这边对解析出来的时间前后进行了额外添加10秒，因为两者的赋值不一定是在一起的中间可能隔了n多的代码多以这个差距你自己实现可以是秒也可以是分

如果是上述情况建议默认吧202111和202112两张表都返回,针对系统而言无非是多查询了一次,效率可以大大滴提高。


```csharp

        public async Task<IActionResult> Query2()
        {
            //查询2021-10-03 07:07:07查询202110
            var multiOrder =await _myDbContext.Set<MultiShardingOrder>().Where(o=>o.Id== 232398109278351360).FirstOrDefaultAsync();
            //查询2021-10-03或07:07:07和2021-12-05 05:05：11查询202110和202112 这边为什么是或因为他是contains,contains的话sharding-core会解析成or
            var longs = new []{ 232398109278351360 , 255197859283087360 };
            var multiOrders = await _myDbContext.Set<MultiShardingOrder>().Where(o => longs.Contains(o.Id)).ToListAsync();
            var dateTime = new DateTime(2021, 11, 1);
            //查询2021-11-21 19:43:00并且要小于2021-11-01 00:00:00查询202111并且202110(因为是小于号所以不带202111)查询出来会报错因为你既要等于202111又要小于202110
            //如何不报错而是返回默认值可以通过启动配置`op.ThrowIfQueryRouteNotMatch = false;`来实现这种情况返回默认值
            var multiOrder404 = await _myDbContext.Set<MultiShardingOrder>().Where(o => o.Id == 250345338962063360&&o.CreateTime< dateTime).FirstOrDefaultAsync();
            return Ok(new
            {
                multiOrder,
                multiOrders,
                multiOrder404
            });

        }
```


::: warning 注意
！！！所有的额外解析都需要自行实现,sharding-core只提供自己的雪花id解析！！！
！！！所有的额外解析都需要自行实现,sharding-core只提供自己的雪花id解析！！！
！！！所有的额外解析都需要自行实现,sharding-core只提供自己的雪花id解析！！！
:::