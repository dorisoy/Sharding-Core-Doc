---
icon: customize
title: 参数配置
category: 使用指南
---

## 配置
```csharp
 services.AddShardingDbContext<MyDbContext>().AddEntityConfig(op =>
            {
                //如果您使用code-first建议选择false
                op.CreateShardingTableOnStart = true;
                //如果您使用code-first建议修改为fsle
                op.EnsureCreatedWithOutShardingTable = true;
                //当无法获取路由时会返回默认值而不是报错
                op.ThrowIfQueryRouteNotMatch = false;
                //如果创建表出错的话是否忽略,如果不忽略就会输出warning的日志
                op.IgnoreCreateTableError = true;
                //是否缓存分库路由表达式缓存仅缓存单个操作
                //sharding data source route filter expression compile cache
                op.EnableDataSourceRouteCompileCache = null;
                //是否缓存分表路由表达式缓存仅缓存单个操作
                //sharding table route filter expression compile cache
                op.EnableTableRouteCompileCache = null;
                //如果找不到路由结果是否抛出异常还是选择返回默认值
                op.ThrowIfQueryRouteNotMatch = false;
                //添加这个对象的字符串创建dbcontext 优先级低 优先采用AddConfig下的
                op.UseShardingQuery((conStr, builder) =>
                {
                    builder.UseSqlServer(conStr).UseLoggerFactory(efLogger);
                });
                //添加这个对象的链接创建dbcontext 优先级低 优先采用AddConfig下的
                op.UseShardingTransaction((connection, builder) =>
                {
                    builder.UseSqlServer(connection).UseLoggerFactory(efLogger);
                });
                //添加分库路由
                op.AddShardingDataSourceRoute<xxx>();
                //添加分表路由
                op.AddShardingTableRoute<xxx>();
            }).AddConfig(op =>//AddConfig必须存在一个
            {
                //当前配置的名称
                op.ConfigId = "a";
                //当前配置优先级
                op.Priority = 1;
                //当前配置链接模式
                op.ConnectionMode = ConnectionModeEnum.SYSTEM_AUTO;
                //当前配置最大连接数
                op.MaxQueryConnectionsLimit = 4;
                //同上配置
                op.UseShardingQuery((conStr, builder) =>
                {
                    builder.UseSqlServer(conStr).UseLoggerFactory(efLogger);
                });
                //同上配置
                op.UseShardingTransaction((connection, builder) =>
                {
                    builder.UseSqlServer(connection).UseLoggerFactory(efLogger);
                });
                //添加默认链接
                op.AddDefaultDataSource("ds0",
                    "Data Source=localhost;Initial Catalog=xxxx;Integrated Security=True;");
                //添加额外数据源链接(分库下会用到)
                op.AddExtraDataSource(sp =>
                {
                    return new Dictionary<string, string>()
                    {
                        { "ds1", "Data Source=localhost;Initial Catalog=xxxx1;Integrated Security=True;" },
                        { "ds2", "Data Source=localhost;Initial Catalog=xxxx2;Integrated Security=True;" },
                    };
                });
                //添加默认的比较器(guid在sqlserver下和c#下比较器排序行为不一致需要手动修复)
                op.ReplaceShardingComparer(sp=>new CSharpLanguageShardingComparer());
                //添加表确认默认提供了sqlserver和mysql的如果有其他的请提交pr补充谢谢
                op.ReplaceTableEnsureManager(sp=>new SqlServerTableEnsureManager<MyDbContext>());
                //添加读写分离
                op.AddReadWriteSeparation(sp =>
                {
                    return new Dictionary<string, IEnumerable<string>>()
                    {
                        {
                            "ds0", new List<string>()
                            {
                                "Data Source=localhost;Initial Catalog=xxxx0_1;Integrated Security=True;"
                            }
                        }
                    };
                }, ReadStrategyEnum.Loop, defaultEnable: true);
            }).EnsureConfig(ShardingConfigurationStrategyEnum.ThrowIfNull);//单个配置后续不会增加了的 如果无法匹配会抛出异常
            //.EnsureMultiConfig(ShardingConfigurationStrategyEnum.ThrowIfNull)//多个配置后续还会增加,使用时必须指定configId 如果无法匹配会抛出异常 还可以指定返回优先级最高的或者返回null 但是返回null的情况下sharding-core将无法正常运行
```

## EnableTableRouteCompileCache
针对分表下的表达式编译,默认null
针对单个结果的表达式进行编译缓存可以有效的提高性能

## EnableDataSourceRouteCompileCache
针对分库下的表达式编译,默认null
针对单个结果的表达式进行编译缓存可以有效的提高性能

## EnsureCreatedWithOutShardingTable

这个属性的意思很好理解就是是否需要在启动的时候创建表，这边的创建表是除了分表的对象，其他对象都会直接创建对应的表，只有当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

有库了不会建库，普通表(非分表的可以是分库的表但不能是分表的表)有任何一张存在库里了别的普通表都不会被创建

::: warning 注意
!!!**只有**当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表!!!

!!!**只有**当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表!!!

!!!**只有**当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表!!!
:::

## CreateShardingTableOnStart

这个属性的意思就是是否需要在启动的时候创建分表了的表，但是由于`efcore`并未提供关于表是否存在的判断，所以如果你将这个值设置为true,那么每次都会在启动的时候都会去执行创建表的方法，这样就会导致启动的时候如果有某些表过多那么就会导致启动速度变慢，可以再您未创建表的时候使用这个属性，创建完成后将这个属性设置为false，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## IgnoreCreateTableError

`sharding-core`默认会在创建表失败后输出错误信息,但是输出的信息会被log记录所以为了log不记录这些信息，可以将这个值设置为true那么如果创建失败(已经存在表)框架将不会抛出对应的错误消息，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## MaxQueryConnectionsLimit

最大并发链接数，就是表示单次查询`sharding-core`允许使用的dbconnection，默认会加上1就是说如果你配置了`MaxQueryConnectionsLimit=10`那么实际`sharding-core`会在同一次查询中开启11条链接最多,为什么是11不是10因为`sharding-core`会默认开启一个链接用来进行空dbconnection的使用。如果不设置本参数那么默认是cpu线程数`Environment.ProcessorCount`

## ConnectionMode
链接模式,可以由用户自行指定，使用内存限制,和连接数限制或者系统自行选择最优

链接模式，有三个可选项，分别是：
### MEMORY_STRICTLY
内存限制模式最小化内存聚合 流式聚合 同时会有多个链接

MEMORY_STRICTLY的意思是最小化内存使用率，就是非一次性获取所有数据然后采用流式聚合

### CONNECTION_STRICTLY
连接数限制模式最小化并发连接数 内存聚合 连接数会有限制

CONNECTION_STRICTLY的意思是最小化连接并发数，就是单次查询并发连接数为设置的连接数`MaxQueryConnectionsLimit`。因为有限制，所以无法一直挂起多个连接，数据的合并为内存聚合采用最小化内存方式进行优化，而不是无脑使用内存聚合


### SYSTEM_AUTO
系统自动选择内存还是流式聚合

系统自行选择会根据用户的配置采取最小化连接数，但是如果遇到分页则会根据分页策略采取内存限制，因为skip过大会导致内存爆炸


::: warning 注意
!!!如果用户手动设置ConnectionMode则按照用户设置的为准,之后判断本次查询skip是否大于UseMemoryLimitWhileSkip,如果是采用`MEMORY_STRICTLY`,之后才是系统动态设置根据`MaxQueryConnectionsLimit`来分配!!!
!!!如果用户手动设置ConnectionMode则按照用户设置的为准,之后判断本次查询skip是否大于UseMemoryLimitWhileSkip,如果是采用`MEMORY_STRICTLY`,之后才是系统动态设置根据`MaxQueryConnectionsLimit`来分配!!!
!!!如果用户手动设置ConnectionMode则按照用户设置的为准,之后判断本次查询skip是否大于UseMemoryLimitWhileSkip,如果是采用`MEMORY_STRICTLY`,之后才是系统动态设置根据`MaxQueryConnectionsLimit`来分配!!!
:::

## ReplaceShardingComparer
添加默认的比较器(guid在sqlserver下和c#下比较器排序行为不一致需要手动修复)

## ReplaceTableEnsureManager
添加表确认默认提供了sqlserver和mysql的如果有其他的请提交pr补充谢谢

## ShardingConfigurationStrategyEnum

### ThrowIfNull
如果找到将抛出异常,单配置下无需管理(推荐、默认也是这个值)

### ReturnNull
如果找不到就返回null,如果返回null那么dbcontext将无法正常运行,所以如果设置返回null请一定要在创建dbcontext之前指定configId

### ReturnHighPriority
当不指定或者找不到对应的当前虚拟数据源或者configId时将返回优先级最高的那个

## AddConfig
支持添加多个配置,每个配置可以指定自定义数据库,并且支持动态添加