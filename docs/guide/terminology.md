---
icon: any
title: 概念
category: 使用指南
---

`sharding-core`框架是一款分表分库组件,一款将efcore的一个dbcontext一个对象一张表扩展成了一个dbcontext一个对象多张表对应多个dbcontext,一款基于表达式解析，具有高性能路由的分表分库框架。

## 全局

### IEntityMetadataManager
`IEntityMetadataManager<TShardingDbContext>`管理对象数据，将对象数据分表和分库的对象进行存储管理，可以区分对象是否分表是否分库，并且可以获取对应的对象类型原数据`EntityMetadata`

```csharp
//直接获取
ShardingContainer.GetService<IEntityMetadataManager<TShardingDbContext>>();
//通过非泛型方法获取
(IEntityMetadataManager)ShardingContainer.GetService(typeof(IEntityMetadataManager<>).GetGenericType0(shardingDbContext.GetType()));
```
### EntityMetadata
`EntityMetadata`对象类型原数据，是针对分表分库对象的数据解析后的存储，通过对象类型原数据可以获取到对象的类型和对应的`虚拟表名`(不带后缀的表名)，`表主键`，是否分表是否分库，包括分表he分库的对应字段属性信息
```csharp
//直接获取
IEntityMetadataManager entityMetadataManager=.....;
entityMetadataManager.TryGet(EntityType);
entityMetadataManager.TryGet<TEntity>(TEntity);
```

### IVirtualDataSource

`IVirtualDataSource<TShardingDbContext>`虚拟数据源，虚拟数据源用于记录当前分库拥有多少个数据源名称(拥有多少个:DataSourceName),
整个dbcontext只有一个，可以通过依赖注入获取 .
```csharp
//直接获取
ShardingContainer.GetService<IVirtualDataSource<TShardingDbContext>>();
//通过非泛型方法获取
(IVirtualDataSource)ShardingContainer.GetService(typeof(IVirtualDataSource<>).GetGenericType0(shardingDbContext.GetType()));
```

::: tip 自定义标题
因为`IVirtualDataSource<TShardingDbContext>`继承`IVirtualDataSource`，并且所有的接口都在`IVirtualDataSource`但是注入为了区分多个`DdbContext`之间所以采用泛型注入，其他接口也是同理
:::

### DataSourceName
数据源名称，默认针对`ShardingCore`每个链接都对应其自己的数据源，都有属于自己的数据源名称和数据源的链接。无论是否分表数据源名称都会有，只不过因为仅分表状态下只链接单个数据库，所以数据源名称在整个框架下只有一个，所以如果您是分表那么数据源名称可以随便添加，因为默认的数据源名称有且只有一个。
```csharp
//配置
 .AddDefaultDataSource("ds0","Data Source=localhost;Initial Catalog=ShardingCoreDBxx0;Integrated Security=True;")
                .AddShardingDataSource(sp =>
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

### IVirtualDataSourceRoute

`IVirtualDataSourceRoute`虚拟数据源路由,如果您的对象十分表对象，那么分表对象必须实现一个虚拟数据源路由`IVirtualDataSourceRoute`，
虚拟数据源路由的作用是用来对分库对象进行路由，告诉框架程序应该如何对分库对象进行路由去对应的数据源里面
```csharp
//首先获取IVirtualDataSource
IVirtualDataSource virtualDataSource=.....;
//方法1
virtualDataSource.GetRoute(EntityType);
//方法2
virtualDataSource.GetRoute<TEntity>();
```



## 分表

- [Tail]
  尾巴、后缀物理表的后缀
- [TableSeparator]
  尾巴前缀虚拟表和物理表的后缀中间的字符
- [物理表]
  顾名思义就是数据库对应的实际表信息,表名(TableName+ TableSeparator+ Tail)比如:SysUser_2021,这边`SysUser`就是原本未分表时候的映射到数据库的物理表名称，后续的下划线`_`表示`TableSeparator`,`2021`表示后缀`Tail`

框架内部所有的分表名称规则都是按照(TableName+ TableSeparator+ Tail)来创建的

### IVirtualTableManager
`IVirtualTableManager<TShardingDbContext>`虚拟表管理者，因为对象和数据库表之间的关系从原先的一对一变成了一对一虚拟表然后虚拟表一对多，所以我们一个对象会对应一个虚拟表，这边的所有的虚拟表全部由`IVirtualTableManager<TShardingDbContext>`管理
```csharp

//获取IVirtualTableManager
ShardingContainer.GetService<IVirtualTableManager<TShardingDbContext>>();
//通过非泛型方法获取
(IVirtualTableManager)ShardingContainer.GetService(typeof(IVirtualTableManager<>).GetGenericType0(shardingDbContext.GetType()));
```

### IVirtualTable

`IVirtualTable`叫做虚拟表,原先`DbContext`对应一个`Entity`对应一张`Table`,虚拟表的出现将`Entity`和`Table`之间多了一个虚拟表的概念，就是说原先的对象是直接映射到实际表，那么因为现在实际表名称有很多张，所以一个对象对应的是虚拟表`IVirtualTable`，虚拟表内部拥有虚拟表路由`IVirtualTableRoute`，虚拟表路由会将crud的结果通过虚拟表路由，路由到对应的实际表，所以原则上你在数据库里面将看不到原表名称的实际表，除非你的分表是没有后缀的。
```csharp
//通过虚拟表管理者
IVirtualTableManager virtualTableManager=....;
virtualTableManager.GetVirtualTable(EntityType)
virtualTableManager.GetVirtualTable<TEntity>()

```

### IVirtualTableRoute
`IVirtualTableRoute`虚拟表路由，针对对象如果我们需要对齐进行分表，那么我么你必须要重写分表的路由，分表路由会告诉程序我们的这个sql执行是该如何找寻对应的实际表，而不用用户手动去指定对应的表，每一个虚拟表都会拥有一个虚拟表路由
```csharp
//首先获取虚拟表
IVirtualTable virtualTable=...;
//通过虚拟表获取虚拟表路由
virtualTable.GetVirtualRoute();
```
