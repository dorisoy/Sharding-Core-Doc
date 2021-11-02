---
icon: launch
title: 快速上手
category: 使用指南
---

## 版本

sharding-core 目前为止以efcore版本号作为主版本，所以您会在nuget上看到2.x,3.x,5.x的版本,如果需要请安装最新版nuget上的efcore版本对应的sharding-core版本


::: warning 注意
如果nuget上的sharding-core版本不适合您目前的efcore版本并且您目前不想升级对应的efcore版本，请自行下载程序进行源码编译替换成您所需要的efcore版本
:::

## 安装和启动

```shell
# 请对应安装您需要的版本
PM> Install-Package ShardingCore -Version LastVersion
```

## 使用efcore

1. 首先我们创建一个空的控制台程序
```shell
# 创建一个目录用于测试
mkdir EFCoreSharding

# 进入创建的目录
cd EFCoreSharding

# 创建一个空的控制台程序
dotnet new console

# 添加efcore 测试我们采用sqlserver作为测试数据库，其他数据库用法一致
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 5.0.11
```

::: warning 注意
这边我们文档编写时控制台程序为net5.0，所以我们这边选择了efcore5的版本的最新版，具体请参考您自己的项目
:::

2. 创建订单对象`Order`：
```csharp
/// <summary>
/// 订单表
/// </summary>
public class Order
{
    /// <summary>
    /// 订单Id
    /// </summary>
    public string Id { get; set; }
    /// <summary>
    /// 付款用户名
    /// </summary>
    public string Payer { get; set; }
    /// <summary>
    /// 付款金额分
    /// </summary>
    public long Money { get; set; }
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; }
    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDelete { get; set; }
}
```
3. 创建efcore的dbcontext
```csharp
public class MyDbContext:DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options):base(options)
    {
        
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Order>(o =>
        {
            o.HasKey(p => p.Id);
            o.Property(p => p.Id).IsRequired().IsUnicode(false).HasMaxLength(40).HasComment("订单Id");
            o.Property(p => p.Payer).IsRequired().HasMaxLength(50).HasComment("付款用户名");
            o.Property(p => p.Money).HasComment("付款金额分");
            o.Property(p => p.CreateTime).HasComment("创建时间");
            o.Property(p => p.IsDelete).HasComment("是否已删除");
            o.HasQueryFilter(p => p.IsDelete == false);
            o.ToTable(nameof(Order));
        });
    }
}
```

4. 启动配置efcore并且插入对应的数据

在`Program`的`Main`函数下添加如下代码
```csharp
class Program
{
    static void Main(string[] args)
    {
        IServiceCollection services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<MyDbContext>(o => o.UseSqlServer("Data Source=localhost;Initial Catalog=EFCoreShardingDB;Integrated Security=True;"));
        var buildServiceProvider = services.BuildServiceProvider();
        using (var scope = buildServiceProvider.CreateScope())
        {
            var myDbContext = scope.ServiceProvider.GetService<MyDbContext>();
            //如果不存在就创建数据库和对应的数据库表
            myDbContext.Database.EnsureCreated();

            var now = new DateTime(2021,1,1);
            var orders = Enumerable.Range(0,10).Select((o,i)=>new Order()
            {
                Id = i.ToString(),
                CreateTime = now.AddDays(i),
                Payer = $"用户:{i}",
                Money = i*100,
                IsDelete = false
            }).ToList();
            myDbContext.AddRange(orders);
            myDbContext.SaveChanges();
        }
    }
}
```
::: tip 提示
  1. 这边我们采用的是`myDbContext.Database.EnsureCreated();`方法可以保证第一次创建对应的表和库。
  2. 并不是所有的efcore都需要按我这种写法,具体按您自己的原先的使用即可。
  2. 程序运行后可以看到数据库和表被创建并且数据被插入到对应的数据库里面了。
:::


## efcore升级到sharding-core

目前efcore的使用是单表单库的和实体对象是一对一的，我们将对此进行升级，添加sharding-core的支持，目前我们这边有两种方式可以配置`Order`支持分表分库：

### 添加sharding-core包
```shell
dotnet add package ShardingCore --version 5.3.1.19
```
::: tip 提示
  根据项目自己选择sharding-core 2.x/3.x/5.x......的最新版本.
:::

### 删除掉原先的数据库
因为目前还没有涉及到code-first的用法所以目前我们先对其进行数据库的重建

### 虚拟路由配置(推荐)
首先我们针对当前已有的项目进行`Order`分表的配置,路由规则订单按Id取模

1. 创建分表路由`OrderVirtualTableRoute`
```csharp
/// <summary>
/// 创建虚拟路由
/// </summary>
public class OrderVirtualTableRoute:AbstractSimpleShardingModKeyStringVirtualTableRoute<Order>
{
    public OrderVirtualTableRoute() : base(2, 3)
    {
    }

    public override void Configure(EntityMetadataTableBuilder<Order> builder)
    {
        builder.ShardingProperty(o => o.Id);
        builder.AutoCreateTable(null);
        builder.TableSeparator("_");
    }
}
```
::: tip 提示
  1. `ShardingProperty`必须指定,表示具体按什么字段进行分表
  2. `AutoCreateTable`可选,表示是否需要在**启动**的时候建表:null表示根据全局配置,true:表示需要,false:表示不需要,默认null
  3. `TableSeparator`可选,表示分表后缀和虚拟表名之间的分隔连接符,默认`_`
  4. `AbstractSimpleShardingModKeyStringVirtualTableRoute<Order>`由sharding-core提供的默认取模分表规则,其中2代表分表后尾巴有两位,3表示按3取模所以后缀为:00,01,02。因为最多2位所以可以最多到99,如果需要了解更多路由[默认路由](/pages/defaultroute)
:::



### 接口特性配置
除了路由配置您还可以使用接口和特性来实现

1. 让订单`Order`继承`IShardingTable`
```csharp
/// <summary>
/// 订单表
/// </summary>
public class Order:IShardingTable
{
  //.....
}
```

2. 对`Order`需要分表的字段进行分表字段特性添加(仅支持一个分表字段)
```csharp
/// <summary>
/// 订单表
/// </summary>
public class Order:IShardingTable
{
  /// <summary>
  /// 订单Id
  /// </summary>
  [ShardingTableKey]
  public string Id { get; set; }
  //.....
}
```

3. 创建分表路由`OrderVirtualTableRoute`
```csharp
/// <summary>
/// 创建虚拟路由
/// </summary>
public class OrderVirtualTableRoute:AbstractSimpleShardingModKeyStringVirtualTableRoute<Order>
{
    public OrderVirtualTableRoute() : base(2, 3)
    {
    }
}
```


::: tip 提示
  1. `ShardingTableKey`特性表示对应的属性是需要被分表的字段,如：`Order`对象通过`Id`属性来进行分表
  2. 按接口+特性分表我们发现虚拟路由里面将不需要配置对应的方法`Configure`
  3. 推荐使用第一种路由处配置对应的分表信息
:::

### 配置dbcontext

替换`MyDbContext`的父类
```csharp
public class MyDbContext:AbstractShardingDbContext,IShardingTableDbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options):base(options)
    {
        
    }
    //....
    public IRouteTail RouteTail { get; set; }
}
```
::: tip 提示
  1. `AbstractShardingDbContext`是系统默认实现了`IShardingDbContext`的抽象类,你也可以自行实现
  2. `IShardingTableDbContext`继承该接口的`DbContext`表示需要实现分表功能,如果您只需要分库那么可以不继承该对象
:::

## 启动配置
介绍完两种配置后下面我们开始对程序进行

目前sharding-core支持两种配置方式,两种配置方式一样
1. 通过`services.AddShardingDbContext<MyDbContext>()`,
2. 通过在原先的配置`services.AddDbContext<MyDbContext>()`后追加新的配置`services.AddShardingConfigure<MyDbContext>()`,

::: tip 提示
  1. 两种配置方式一样,第一种是对第二种的封装而已,具体使用那种都可以按自己的需要
  2. 原`AddDbContext`需要添加配置`UseSharding<MyDbContext>()` 
:::

```csharp
class Program
{
    static void Main(string[] args)
    {
        IServiceCollection services = new ServiceCollection();
        services.AddLogging();
        //原来的dbcontext配置
        services.AddDbContext<MyDbContext>(o =>
            o.UseSqlServer("Data Source=localhost;Initial Catalog=EFCoreShardingDB;Integrated Security=True;")
                .UseSharding<MyDbContext>()//需要添加
            );
        //额外添加分片配置
        services.AddShardingConfigure<MyDbContext>((conn, builder) =>
            {
                builder.UseSqlServer(conn);
            }).Begin(o =>
            {
                o.AutoTrackEntity = true;
                o.CreateShardingTableOnStart = true;
                o.EnsureCreatedWithOutShardingTable = true;
            }).AddShardingTransaction((connection, builder) =>
            {
                builder.UseSqlServer(connection);
            }).AddDefaultDataSource(Guid.NewGuid().ToString("n"),
                "Data Source=localhost;Initial Catalog=EFCoreShardingDB;Integrated Security=True;")
            .AddShardingTableRoute(op =>
            {
                op.AddShardingTableRoute<OrderVirtualTableRoute>();
            }).End();

        var buildServiceProvider = services.BuildServiceProvider();
        //启动必备
        buildServiceProvider.GetRequiredService<IShardingBootstrapper>().Start();
        using (var scope = buildServiceProvider.CreateScope())
        {
            var myDbContext = scope.ServiceProvider.GetService<MyDbContext>();
            //如果不存在就创建数据库和对应的数据库表
            //myDbContext.Database.EnsureCreated();//注释掉不然会创建虚拟表，虚拟表其实没什么用

            var now = new DateTime(2021,1,1);
            var orders = Enumerable.Range(0,10).Select((o,i)=>new Order()
            {
                Id = i.ToString(),
                CreateTime = now.AddDays(i),
                Payer = $"用户:{i}",
                Money = i*100,
                IsDelete = false
            }).ToList();
            myDbContext.AddRange(orders);
            myDbContext.SaveChanges();
        }
    }
}
```
启动项目后我们可以看到程序会自动创建数据库和表结构，并且会按照我们设定的规则进行取模插入,并且逻辑表名`Order`将不会存在于数据库
::: danger
！！！如果您使用第二种配置,那么请对`services.AddDbContext<MyDbContext>()`配置内部使用的数据库连接字符串和后续的`AddDefaultDataSource`中添加的字符串一致不然会导致无法使用事务。

！！！如果您使用第二种配置,那么请对`services.AddDbContext<MyDbContext>()`配置内部使用的数据库连接字符串和后续的`AddDefaultDataSource`中添加的字符串一致不然会导致无法使用事务。

！！！如果您使用第二种配置,那么请对`services.AddDbContext<MyDbContext>()`配置内部使用的数据库连接字符串和后续的`AddDefaultDataSource`中添加的字符串一致不然会导致无法使用事务。
:::

::: tip 提示
  1. 如果程序无法启动请确保一下几点，确认是否已经注入原生的efcore的DbContext,并且在原生的后续对DbContextOptions进行了`UseSharding<MyDbContext>()`配置
  2. 是否配置了额外分片`AddShardingConfigure`(第一种配置可以忽略)，是否创建了通过字符串委托和链接委托
  3. default data source 的连接字符串是否和默认dbcontext创建的一致
  4. 是否添加了分表路由`AddShardingTableRoute(op =>{op.AddShardingTableRoute<OrderVirtualTableRoute>();})`
  5. 是否启动了分表启动器`buildServiceProvider.GetRequiredService<IShardingBootstrapper>().Start();`
:::