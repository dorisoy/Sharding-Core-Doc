---
icon: launch
title: x.5升级到x.6指南
category: x.5升级到x.6指南
---

## 说明
如果您目前是处于比较低的版本建议一步一步升级上来,目前而言x.6版本有着很大的一个变动,基本上对于很多用户而言使用上会有差异

## 优点
- 对于原先的所有`ShardingCore`的版本是通过静态方法`ShardingContaner`来调用的，导致程序整个生命周期只有一个配置项,并且是静态的,就会导致系统对于同一个`DbContext`类型是没办法采用多种配置手段的,而且对于code-first而言的使用体验上也是欠佳的,而新版本将其整个框架只和一个分片运行上下文关联`IShardingRuntimeContext`而不是原先的`ShardingContaner`

## 注意点
-  6版本将不在依赖DbContextType,所以所有的原先依赖注入的泛型方法全部失效,并且无法注入，取而代之的是`IShardingRuntimeContext`,可以使用依赖注入来注入,也可以通过dbcontext获取,更可以用户赋值给静态属性,完全由用户定义
- 之前所有的依赖注入获取的东西将全部由`IShardingRuntimeContext`提供
- 因为整个`efcore`在`ShardingCore`中仅依赖`IShardingRuntimeContext`,所以不同`IShardingRuntimeContext`对efcore而言就是不同的配置,所以目前移除掉多配置(多租户模式),用户可以自行实现。
- 原先Migrations迁移操作需要新建一个控制台程序,并且迁移后的更新数据库不支持分库数据库,所以为了用户的使用体验,进行了优化兼容升级
- 原先的设计虚拟表，虚拟表管理者被移除,直接使用路由管理者管理路由,移除了物理表,虚拟表,虚拟表管理者这个概念
- 启动后创建分表分库将由原先的配置改成手动调用,这样可以自己选择符合的实际
- 默认使用efcore将不在依赖整个启动器,只需要依赖轻量级的上下文即可


## 原先startup
x.4.x.x-x.5.x.x版本
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



                //必须且必须在调用这个方法后才可以使用dbcontext
                app.ApplictaionServices.GetService<IShardingBootStrapper>().Start();
```
## 现在的startup
x.6.x.x+
```csharp

            services.AddShardingDbContext<ShardingDefaultDbContext>()
                .UseRouteConfig(op =>
                {
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
                .UseConfig(op =>
                {
                    //当无法获取路由时会返回默认值而不是报错
                    op.ThrowIfQueryRouteNotMatch = false;
                    //忽略建表错误compensate table和table creator
                    op.IgnoreCreateTableError = true;
                    //迁移时使用的并行线程数(分库有效)defaultShardingDbContext.Database.Migrate()
                    op.MigrationParallelCount = Environment.ProcessorCount;
                    //补偿表创建并行线程数 调用UseAutoTryCompensateTable有效
                    op.CompensateTableParallelCount = Environment.ProcessorCount;
                    //最大连接数限制
                    op.MaxQueryConnectionsLimit = Environment.ProcessorCount;
                    //链接模式系统默认
                    op.ConnectionMode = ConnectionModeEnum.SYSTEM_AUTO;
                    //如何通过字符串查询创建DbContext
                    op.UseShardingQuery((conStr, builder) =>
                    {
                        builder.UseSqlServer(conStr).UseLoggerFactory(efLogger);
                    });
                    //如何通过事务创建DbContext
                    op.UseShardingTransaction((connection, builder) =>
                    {
                        builder.UseSqlServer(connection).UseLoggerFactory(efLogger);
                    });
                    //添加默认数据源
                    op.AddDefaultDataSource("A",
                        "Data Source=localhost;Initial Catalog=ShardingCoreDBA;Integrated Security=True;");
                    //添加额外数据源
                    op.AddExtraDataSource(sp =>
                    {
                        return new Dictionary<string, string>()
                    {
                        { "B", "Data Source=localhost;Initial Catalog=ShardingCoreDBB;Integrated Security=True;" },
                        { "C", "Data Source=localhost;Initial Catalog=ShardingCoreDBC;Integrated Security=True;" },
                    };
                    });
                    //添加读写分离
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
                })
                .ReplaceService<ITableEnsureManager,SqlServerTableEnsureManager>()
                .AddShardingCore();




            //启动ShardingCore创建表任务(不调用也可以使用ShardingCore)
            //不调用会导致定时任务不会开启
            app.ApplictaionServices.UseAutoShardingCreate();
            //启动进行表补偿(不调用也可以使用ShardingCore)
            app.ApplictaionServices.UseAutoTryCompensateTable();

```


## 区别


功能  | 说明| x.5 | x.6  
--- | --- | --- | --- 
CreateShardingTableOnStart |  启动创建分表 | √  |  UseAutoTryCompensateTable
EnsureCreatedWithOutShardingTable | 创建库和非分表的表 |  √  | UseAutoTryCompensateTable
CreateDataBaseOnlyOnStart |  启动仅创建库 | √  | UseAutoTryCompensateTable
IgnoreCreateTableError |  忽略建表错误 | √ | √ |
ThrowIfQueryRouteNotMatch |  无法匹配路由报错 | √ | √ 
ConfigId |  配置id | √ | -
Priority |  配置优先级 | √ | - 
MaxQueryConnectionsLimit |  最大连接数 | √ | √ 
ConnectionMode |  默认链接模式 | √ | √ 
AddShardingTableRoute |  添加分表路由 | √ | √ 
AddShardingDataSourceRoute |  添加分库路由 | √ | √ 
MigrationParallelCount |  迁移并行数 | - | √ 
CompensateTableParallelCount |  补偿表并行数 | - | √ 
UseShardingQuery |  连接字符串创建DbContextOptions | √ | √ 
UseShardingTransaction |  连接创建DbContextOptions | √ | √ 
AddDefaultDataSource |  默认数据源 | √ | √ 
AddExtraDataSource |  额外数据源 | √ | √ 
AddReadWriteSeparation |  读写分离 | √ | √ 
ReplaceTableEnsureManager |  替换表确认 | √ | 使用ReplaceService 
IShardingBootStrapper.Start() |  启动ShardingCore | √ | - 
UseAutoShardingCreate |  启动定时任务建表 | 包含在Start | √ 
UseAutoTryCompensateTable |  补偿表 | √ | √ 


**总结** 
对于AspNetCore的升级迁移其实目前来看并不算很大
- 1.移除了多配置,因为目前配置随着`IShardingRuntimeContext`进行整个DbContext的贯穿所以多配置可以用户自定义
- 2.依赖注入全部不能使用,之前所有的依赖注入将全部通过`IShardingRuntimeContext`获取,
`IShardingRuntimeContext`的内部依赖注入如果非应用程序依赖注入将无法获取应用本身的注入服务,`IShardingRuntimeContext`如果按上述注入那么可以依赖注入获取,如果静态注入那么可以通过静态属性获取,当然也可以通过DbContext获取
- 3.ShardingContainer移除自行实现
- 4.迁移默认支持分库,并且不再需要新建控制台和`DesginTimeFactory`来实现
- 5.所有的参数配置从`AddEntityConfig`/`UseRouteConfig`迁移到了 `AddConfig`/`UseConfig`处
- 6.所有的ShardingCore提供的泛型接口全部转成非泛型接口,因为`IShardingRuntimeContext`本身和`DbContext`类型并没有太多关系
- 7.移除`ShardingContainer`静态方法自行处理
- 8.移除`IVirtualDataSourceManager`本身默认移除静态方式所以不再支持多配置,用户可以通过自定义多个`IShardingRuntimeContext`来实现多配置
- 9.移除`IDataSource`的路由功能,拆分到`IDataSourceRouteManager`里面
- 10.移除`IVirtualTableManager`由于之前架构设计过于复杂导致使用起来很复杂并且概念很多,这次索性直接移除虚拟表概念直接由路由提供,可以通过`ITableRouteManager`来代替使用
- 11.移除`IVirtualTable`概念
- 12.移除`IPhysicTable`概念,表信息由`IEntityMetadataManager`的`EntityMetadata`提供
- 13.`VirtualTableName`概念改成`LogicTableName`就是原先的未分表的表名
- 14.如果你是abp或者其他自定义的DbContext需要实现的接口GetDbContext参数进行了改变由原先的bool类型isParallelQuery变成了创建生成枚举