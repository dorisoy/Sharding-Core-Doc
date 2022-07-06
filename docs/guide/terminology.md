---
icon: any
title: 概念
category: 使用指南
---

`sharding-core`框架是一款分表分库组件,一款将efcore的一个dbcontext一个对象一张表扩展成了一个dbcontext一个对象多张表对应多个dbcontext,一款基于表达式解析，具有高性能路由的分表分库框架。

## 全局

### ShellDbContext壳DbContext
用户和业务系统交互,单并不是正真执行得DbContext

### IShardingRuntimeContext
`IShardingRuntimeContext`让`DbContext`支持`Sharding`功能的上下文,用于构建出不同的`DbContextOptions`使用不同的`IShardingRuntimeContext`那么就可以让`DbContext`支持不同的`Sharding`,并且一下所有配置都由`IShardingRuntimeContext`获取,而不是依赖注入,`IShardingRuntimeContext`可以由依赖注入获取也可以用户自行保存譬如:静态属性

```csharp
  var shardingRuntimeContext = new ShardingRuntimeBuilder<DefaultShardingDbContext>()
                    .UseRouteConfig(o =>
                    {
                        o.AddShardingTableRoute<SysUserLogByMonthRoute>();
                        o.AddShardingTableRoute<SysUserModVirtualTableRoute>();
                         o.AddShardingDataSourceRoute<SysUserModVirtualDataSourceRoute>();
                    }).UseConfig(o =>
                    { 
                        o.UseShardingQuery((conStr,builder)=>
                        {
                            builder.UseMySql(conStr, new MySqlServerVersion(new Version()));
                        });
                        o.UseShardingTransaction((connection, builder) =>
                        {
                            builder
                                .UseMySql(connection, new MySqlServerVersion(new Version()));
                        });
                        o.AddDefaultDataSource("ds0", "server=127.0.0.1;port=3306;database=dbdbd0;userid=root;password=root;");
                    }).ReplaceService<ITableEnsureManager,MySqlTableEnsureManager>()
                    .Build(sp);//sp为依赖注入的应用程序的依赖注入服务的提供者
```

## 以下所有服务由IShardingRuntimeContext获取

### IShardingProvider
`IShardingProvider`对应配置信息获取如果配置时传入应用`IServiceProvider`那么也可以通过本接口获取应用的注入服务
```csharp
shardingRuntimeContext.GetShardingProvider();
```

### IShardingRouteConfigOptions
`IShardingRouteConfigOptions`路由表的启动配置

```csharp
shardingRuntimeContext.GetShardingRouteConfigOptions();
```

### IDbContextCreator
`IDbContextCreator`DbContext创建者如果是通过依赖注入使用的ShardingCore和DbContext那么不需要管,否则需要重写

```csharp
shardingRuntimeContext.GetDbContextCreator();
```

### IEntityMetadataManager
`IEntityMetadataManager管理对象数据，将对象数据分表和分库的对象进行存储管理，
可以区分对象是否分表是否分库，并且可以获取对应的对象类型元数据`EntityMetadata`,所有类型的对象都可以被获取只要是DbContext所依赖的

```csharp
shardingRuntimeContext.GetEntityMetadataManager();
```
### EntityMetadata
`EntityMetadata`对象类型元数据，是针对分表分库对象的数据解析后的存储，通过对象类型元数据可以获取到对象的类型和对应的`虚拟表名`(不带后缀的表名)，`表主键`，是否分表是否分库，包括分表he分库的对应字段属性信息
```csharp
IEntityMetadataManager entityMetadataManager=.....;
entityMetadataManager.TryGet(EntityType);
entityMetadataManager.TryGet<TEntity>(TEntity);
```

### IVirtualDataSource
`IVirtualDataSource`当前上下文的虚拟数据源,记录着除了默认数据源外的额外数据源链接信息
```csharp
shardingRuntimeContext.GetVirtualDataSource();
```


### IDataSourceRouteManager
`IDataSourceRouteManager`分库路由管理者,可以根据对象进行分库选择路由
```csharp
shardingRuntimeContext.GetDataSourceRouteManager();
```


### ITableRouteManager
`ITableRouteManager`分表路由管理者,可以根据对象进行分表选择路由
```csharp
shardingRuntimeContext.GetTableRouteManager();
```

### DataSourceName
数据源名称，默认针对`ShardingCore`每个链接都对应其自己的数据源，都有属于自己的数据源名称和数据源的链接。无论是否分表数据源名称都会有，只不过因为仅分表状态下只链接单个数据库，所以数据源名称在整个框架下只有一个，所以如果您是分表那么数据源名称可以随便添加，因为默认的数据源名称有且只有一个。
```csharp
//配置
.AddDefaultDataSource("ds0","Data Source=localhost;Initial Catalog=ShardingCoreDBxx0;Integrated Security=True;");
.AddExtraDataSource(sp =>
{
    return new Dictionary<string, string>()
    {
        {"ds1", "Data Source=localhost;Initial Catalog=ShardingCoreDBxx1;Integrated Security=True;"},
        {"ds2", "Data Source=localhost;Initial Catalog=ShardingCoreDBxx2;Integrated Security=True;"},
    };
})
```
通过上面我们可以看到我们其实分了三个数据库分别是`ds0`,`ds1`,`ds2`,使用分表的时候需要注意，仅分表对象才会进入分表，其他所有没有分表路由的对象将全部走DefaultDataSourceName数据库。

### IShardingTableCreator
分表对象创建,可以创建对应的分表指定对应的表后缀即可
```csharp
//直接获取
ShardingContainer.GetService<IShardingTableCreator<TShardingDbContext>>();
//通过非泛型方法获取
(IShardingTableCreator)ShardingContainer.GetService(typeof(IShardingTableCreator<>).GetGenericType0(shardingDbContext.GetType()));

```



## 分库概念

### IDataSourceRouteManager

`IDataSourceRouteManager`分库路由管理者,如果您的对象是一个分库对象，那么分库对象必须实现一个虚拟数据源路由`IVirtualDataSourceRoute`，
虚拟数据源路由的作用是用来对分库对象进行路由，告诉框架程序应该如何对分库对象进行路由去对应的数据源里面
```csharp
//首先获取IDataSourceRouteManager
IDataSourceRouteManager dataSourceRouteManager=.....;
//获取路由
dataSourceRouteManager.GetRoute(EntityType);

//直接路由
dataSourceRouteManager.RouteTo(.....)
```



## 分表

- [Tail]
  尾巴、后缀物理表的后缀
- [TableSeparator]
  尾巴前缀虚拟表和物理表的后缀中间的字符
- [物理表]
  顾名思义就是数据库对应的实际表信息,表名(TableName+ TableSeparator+ Tail)比如:SysUser_2021,这边`SysUser`就是原本未分表时候的映射到数据库的物理表名称，后续的下划线`_`表示`TableSeparator`,`2021`表示后缀`Tail`

框架内部所有的分表名称规则都是按照(TableName+ TableSeparator+ Tail)来创建的

### ITableRouteManager
`ITableRouteManager`分表路由管理者，因为对象和数据库表之间的关系从原先的一对一变成了一对一分表路由所以我们一个对象会对应一个分表路由，分表路由里面有对应表的所有分表后缀

```csharp
//获取分表路由管理者
ITableRouteManager tableRouteManager=....
tableRouteManager.GetRoute(EntityType);

//直接路由
tableRouteManager.RouteTo(.....)
```

### IVirtualTableRoute
`IVirtualTableRoute`虚拟表路由，针对对象如果我们需要对其进行分表，那么我么你必须要重写分表的路由，分表路由会告诉程序我们的这个sql执行是该如何找寻对应的实际表，而不用用户手动去指定对应的表，每一个虚拟表都会拥有一个虚拟表路由
```csharp
//首先获取分表管理者
ITableRouteManager tableRouteManager=...;
//通过分表路由管理者获取分表路由
tableRouteManager.GetRoute(EntityType);
```
