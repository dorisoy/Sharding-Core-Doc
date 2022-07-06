---
icon: launch
title: x.3升级到x.4指南
category: x.3升级到x.4指南
---

## 说明
如果您目前正在使用x.3.x.x希望可以升级到最新版本的x.4.x.x那么可以通过查看对比如下差异来选择是否升级

## 优点
- x.4.x.x版本相较于x.3.x.x版本新增额外功能多配置,原先针对x.3.x.x版本如果是多租户下一个租户使用一个数据库链接那么所创建的对象必须要支持分库,才可以没办法动态切换默认数据库,并且额外所有表都需要支持分库,在x.4.x.x版本新增了多配置动态获取,保证了在单配置情况下还是和原先一样的情况下多配置下支持额外动态配置,分库隔离的情况下不需要针对所有对象进行分库处理操作。
- 后续会对x.3.x.x版本进行bug修复,但是不会增加新功能,后续的新功能和优化都会在最新版上进行
- 支持多租户下不同租户的不同数据库

## 注意点
- 4版本和3版本的区别除了动态多配置外,还有启动时候的配置方式进行了改变。
- `IVirtualDataSource<TShardingDbContext>`无法通过依赖注入获取,取而代之的是`IVirtualDataSourceManager<TShardingDbContext>`
- `IShardingDbContext`需要实现一个新方法可以通过`shardingDbContextExecutor`来进行实现
- `IShardingComparer`无法通过依赖注入获取并且移除泛型接口
- `IConnectionStringManager`移除泛型接口,并且不支持依赖注入,可以通过`IVirtualDataSource<TShardingDbContext>`来进行获取
- `IShardingConnectionStringResolver`移除泛型接口,并且不支持依赖注入
- `IReadWriteOptions<TShardingDbContext>`被移除
- `IShardingDbContextOptionsBuilderConfig<TShardingDbContext>`被移除


## 原先startup
```csharp
services.AddShardingDbContext<ShardingDefaultDbContext>((conn, o) =>
                    o.UseSqlServer(conn).UseLoggerFactory(efLogger))
                .Begin(o =>
                {
                    o.CreateShardingTableOnStart = true;
                    o.EnsureCreatedWithOutShardingTable = true;

                    o.ThrowIfQueryRouteNotMatch = false;
                    //o.AddParallelTables(typeof(SysUserMod), typeof(SysUserSalary));
                })
                .AddShardingTransaction((connection, builder) =>
                    builder.UseSqlServer(connection).UseLoggerFactory(efLogger))
                .AddDefaultDataSource("A", "Data Source=localhost;Initial Catalog=ShardingCoreDBA;Integrated Security=True;")
                .AddShardingDataSource(sp =>
                {
                    return new Dictionary<string, string>()
                    {
                        { "B", "Data Source=localhost;Initial Catalog=ShardingCoreDBB;Integrated Security=True;" },
                        { "C", "Data Source=localhost;Initial Catalog=ShardingCoreDBC;Integrated Security=True;" },
                    };
                })
                .AddShardingDataSourceRoute(o =>
                {
                    o.AddShardingDatabaseRoute<OrderAreaShardingVirtualDataSourceRoute>();
                })
                .AddShardingTableRoute(op =>
                {
                    op.AddShardingTableRoute<SysUserModVirtualTableRoute>();
                    op.AddShardingTableRoute<SysUserSalaryVirtualTableRoute>();
                    op.AddShardingTableRoute<OrderCreateTimeVirtualTableRoute>();
                    op.AddShardingTableRoute<LogDayVirtualTableRoute>();
                    op.AddShardingTableRoute<LogWeekDateTimeVirtualTableRoute>();
                    op.AddShardingTableRoute<LogWeekTimeLongVirtualTableRoute>();
                    op.AddShardingTableRoute<LogYearDateTimeVirtualRoute>();
                    op.AddShardingTableRoute<LogMonthLongvirtualRoute>();
                    op.AddShardingTableRoute<LogYearLongVirtualRoute>();
                    op.AddShardingTableRoute<SysUserModIntVirtualRoute>();
                    op.AddShardingTableRoute<LogDayLongVirtualRoute>();
                    op.AddShardingTableRoute<MultiShardingOrderVirtualTableRoute>();
                }).AddReadWriteSeparation(sp =>
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
                .AddTableEnsureManager(sp=>new SqlServerTableEnsureManager<ShardingDefaultDbContext>())
                .End();
```
## 现在的startup
```csharp

            services.AddShardingDbContext<ShardingDefaultDbContext>()
                .AddEntityConfig(op =>
                {
                    //如果您使用code-first建议选择false
                    op.CreateShardingTableOnStart = true;
                    //如果您使用code-first建议修改为fsle
                    op.EnsureCreatedWithOutShardingTable = true;
                    //当无法获取路由时会返回默认值而不是报错
                    op.ThrowIfQueryRouteNotMatch = false;
                    //这边设置了如果AddConfig没设置就是用这边的
                    //op.UseShardingQuery((conStr, builder) =>
                    //{
                    //    builder.UseSqlServer(conStr).UseLoggerFactory(efLogger);
                    //});
                    //op.UseShardingTransaction((connection, builder) =>
                    //{
                    //    builder.UseSqlServer(connection).UseLoggerFactory(efLogger);
                    //});
                    op.AddShardingDataSourceRoute<OrderAreaShardingVirtualDataSourceRoute>();
                    op.AddShardingTableRoute<SysUserModVirtualTableRoute>();
                    op.AddShardingTableRoute<SysUserSalaryVirtualTableRoute>();
                    op.AddShardingTableRoute<OrderCreateTimeVirtualTableRoute>();
                    op.AddShardingTableRoute<LogDayVirtualTableRoute>();
                    op.AddShardingTableRoute<LogWeekDateTimeVirtualTableRoute>();
                    op.AddShardingTableRoute<LogWeekTimeLongVirtualTableRoute>();
                    op.AddShardingTableRoute<LogYearDateTimeVirtualRoute>();
                    op.AddShardingTableRoute<LogMonthLongvirtualRoute>();
                    op.AddShardingTableRoute<LogYearLongVirtualRoute>();
                    op.AddShardingTableRoute<SysUserModIntVirtualRoute>();
                    op.AddShardingTableRoute<LogDayLongVirtualRoute>();
                    op.AddShardingTableRoute<MultiShardingOrderVirtualTableRoute>();

                })
                .AddConfig(op =>
                {
                    op.ConfigId="c1";
                    //op.Priority = 1;

                    op.UseShardingQuery((conStr, builder) =>
                    {
                        builder.UseSqlServer(conStr).UseLoggerFactory(efLogger);
                    });
                    op.UseShardingTransaction((connection, builder) =>
                    {
                        builder.UseSqlServer(connection).UseLoggerFactory(efLogger);
                    });

                    op.AddDefaultDataSource("A",
                        "Data Source=localhost;Initial Catalog=ShardingCoreDBA;Integrated Security=True;");
                    op.AddExtraDataSource(sp =>
                    {
                        return new Dictionary<string, string>()
                    {
                        { "B", "Data Source=localhost;Initial Catalog=ShardingCoreDBB;Integrated Security=True;" },
                        { "C", "Data Source=localhost;Initial Catalog=ShardingCoreDBC;Integrated Security=True;" },
                    };
                    });
                    op.AddReadWriteSeparation(sp =>
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
                    }, ReadStrategyEnum.Loop, defaultEnable: false, readConnStringGetStrategy: ReadConnStringGetStrategyEnum.LatestEveryTime);
                    op.ReplaceTableEnsureManager(sp => new SqlServerTableEnsureManager<ShardingDefaultDbContext>());
                }).EnsureConfig();
```

**总结** 移除`AddShardingDbContext`委托参数,将分表分库路由添加新增到了`AddEntityConfig`,额外新增`AddConfig`额外多了一个必填字段ConfigId用于在多配置下进行获取,当然如果你是单配置的那么可以忽略,`EnsureConfig`表示为单个配置`EnsureMultiConfig`表示为多配置,目前Startup必须要配置一个`AddConfig`