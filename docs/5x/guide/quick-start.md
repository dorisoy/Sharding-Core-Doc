---
icon: launch
title: 快速上手
category: 使用指南
---


## Demo
本次demo源码：[EFCoreSharding](https://github.com/xuejmnet/ShardingCoreDocDemo/tree/main/EFCoreSharding)

## 快速开始
5步实现按月分表,且支持自动化建表建库
### 第一步安装依赖
`ShardingCore`版本表现形式为a.b.c.d,其中a表示`efcore`的版本号,b表示`ShardingCore`的主版本号,c表示`ShardingCore`次级版本号,d表示`ShardingCore`的修订版本号
```shell
# 请对应安装您需要的版本
PM> Install-Package ShardingCore
# use sqlserver
PM> Install-Package Microsoft.EntityFrameworkCore.SqlServer
#  use mysql
#PM> Install-Package Pomelo.EntityFrameworkCore.MySql
# use other database driver,if efcore support
```

### 第二步创建查询对象

查询对象
```csharp

    /// <summary>
    /// order table
    /// </summary>
    public class Order
    {
        /// <summary>
        /// order Id
        /// </summary>
        public string Id { get; set; }
        /// <summary>
        /// payer id
        /// </summary>
        public string Payer { get; set; }
        /// <summary>
        /// pay money cent
        /// </summary>
        public long Money { get; set; }
        /// <summary>
        /// area
        /// </summary>
        public string Area { get; set; }
        /// <summary>
        /// order status
        /// </summary>
        public OrderStatusEnum OrderStatus { get; set; }
        /// <summary>
        /// CreationTime
        /// </summary>
        public DateTime CreationTime { get; set; }
    }
    public enum OrderStatusEnum
    {
        NoPay=1,
        Paying=2,
        Payed=3,
        PayFail=4
    }
```
### 第三步创建dbcontext
dbcontext `AbstractShardingDbContext`和`IShardingTableDbContext`如果你是普通的DbContext那么就继承`AbstractShardingDbContext`需要分表就实现`IShardingTableDbContext`,如果只有分库可以不实现`IShardingTableDbContext`接口
```csharp

    public class MyDbContext:AbstractShardingDbContext,IShardingTableDbContext
    {
        public MyDbContext(DbContextOptions<MyDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o=>o.Payer).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o => o.Area).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o => o.OrderStatus).HasConversion<int>();
                entity.ToTable(nameof(Order));
            });
        }
        /// <summary>
        /// empty impl if use sharding table
        /// </summary>
        public IRouteTail RouteTail { get; set; }
    }
```

### 第四步添加分表路由

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
  4. `AbstractSimpleShardingModKeyStringVirtualTableRoute<Order>`由sharding-core提供的默认取模分表规则,其中2代表分表后尾巴有两位,3表示按3取模所以后缀为:00,01,02。因为最多2位所以可以最多到99,如果需要了解更多路由[默认路由](/sharding-core-doc/pages/defaultroute)
:::


### 第五步配置启动项
无论你是何种数据库只需要修改`AddDefaultDataSource`里面的链接字符串 请不要修改委托内部的UseXXX参数 `conStr` and `connection`
```csharp

        public void ConfigureServices(IServiceCollection services)
        {

            //添加分片配置
            services.AddShardingDbContext<MyDbContext>()
                .AddEntityConfig(op =>
                {
                    op.CreateShardingTableOnStart = true;
                    op.EnsureCreatedWithOutShardingTable = true;
                    op.UseShardingQuery((conn, builder) =>
                    {
                        builder.UseSqlServer(conn);
                    });
                    op.UseShardingTransaction((conn, builder) =>
                    {
                        builder.UseSqlServer(conn);
                    });
                    op.AddShardingTableRoute<OrderVirtualTableRoute>();
                }).AddConfig(op =>
                {
                    op.ConfigId = "c1";
                    op.AddDefaultDataSource(Guid.NewGuid().ToString("n"),
                        "Data Source=localhost;Initial Catalog=EFCoreShardingTableDB;Integrated Security=True;");
                }).EnsureConfig();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            // it's importment don't forget it
            app.ApplicationServices.GetRequiredService<IShardingBootstrapper>().Start();
            // other configure....
        }
```
这样所有的配置就完成了你可以愉快地对Order表进行按月分表了

```csharp
[Route("api/[controller]")]
public class ValuesController : Controller
{
        private readonly MyDbContext _myDbContext;

        public ValuesController(MyDbContext myDbContext)
        {
            _myDbContext = myDbContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var order = await _myDbContext.Set<Order>().FirstOrDefaultAsync(o => o.Id == "2");
            return OK(order)
        }
}
```
::: tip 提示
  1. 如果程序无法启动请确保一下几点，确认是否已经注入原生的efcore的DbContext,并且在原生的后续对DbContextOptions进行了`UseSharding<MyDbContext>()`配置
  2. 目前`ShardingCore`提供了三种配置方式
  - 1.默认配置
  ```csharp
  services.AddShardingDbContext<MyDbContext>()
  ```
  这个配置包含了`AddDbContext`+`AddShardingConfigure`
  - 2.额外配置
  ```csharp
    //原来的dbcontext配置
    services.AddDbContext<MyDbContext>(DIExtension.UseDefaultSharding<MyDbContext>);
    //额外添加分片配置
    services.AddShardingConfigure<MyDbContext>()
  ```
  - 3.字符串配置适合单配置的情况下
  ```csharp
    //原来的dbcontext配置
    services.AddDbContext<MyDbContext>(options=>options.UseSqlServer("连接字符串必须和AddConfig的DefaultDataSource一样").UseSharding<TodoAppDbContext>());//UseSharding<TodoAppDbContext>()必须要配置
    //额外添加分片配置
    services.AddShardingConfigure<MyDbContext>()
  ```
  3. default data source 的连接字符串是否和默认dbcontext创建的一致
  4. 是否添加了分表路由`op.AddShardingTableRoute<OrderVirtualTableRoute>();`
  5. 是否启动了分表启动器`buildServiceProvider.GetRequiredService<IShardingBootstrapper>().Start();`
:::
