---
icon: stack
title: 初始化
category: 使用指南
---

## 分表使用

先拟定一个场景目前有用户表`SysUser`和订单表`Order`,再添加一个`Setting`配置表，用户我们按用户id进行取模分表，订单我们按时间月进行分表,配置表我们部分表
首先创建一个空的aspnetcore web api。

### 安装ShardingCore
```shell
# 请对应安装您需要的版本
PM> Install-Package ShardingCore
# 请对应数据库版本
PM> Install-Package Microsoft.EntityFrameworkCore.SqlServer
``` 

### 创建对象
```csharp
    public enum OrderStatusEnum
    {
        NoPay=1,
        Paying=2,
        Payed=3,
        PayFail=4
    }
    public class Order
    {
        public string Id { get; set; }
        public string Payer { get; set; }
        public long Money { get; set; }
        public string Area { get; set; }
        public OrderStatusEnum OrderStatus { get; set; }
        public DateTime CreationTime { get; set; }
    }
    public class SysUser
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string SettingCode { get; set; }
        public string Area { get; set; }
    }
    public class Setting
    {
        public string Code { get; set; }
        public string Name { get; set; }
    }
```

### 创建DbContext
这样我们就创建好了三张表，接下来我们创建我们的`DbContext`
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
            modelBuilder.Entity<SysUser>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o=>o.Name).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o => o.Area).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o => o.SettingCode).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.ToTable(nameof(SysUser));
            });
            modelBuilder.Entity<Setting>(entity =>
            {
                entity.HasKey(o => o.Code);
                entity.Property(o => o.Code).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.Property(o=>o.Name).IsRequired().IsUnicode(false).HasMaxLength(50);
                entity.ToTable(nameof(Setting));
            });
        }

        public IRouteTail RouteTail { get; set; }
    }
```
::: tip 自定义标题
 1. 构造函数必须是`DbContextOptions<MyDbContext>`或者`DbContextOptions`
 2. `OnModelCreating`并不是说分表必须要这样，而是你原先efcore怎么使用就怎么使用，efcore配置对象有两种一种是`DbSet`+`Attribute`,另外一种是`OnModelCreating`+`ModelBuilder`,你可以选择你原先在用的任何一种
 3. `AbstractShardingDbContext`这个对象是可以不继承的，但是如果要使用分表分库你必须实现`IShardingTableDbContext`这个接口,因为这个接口实现起来都是一样的所以默认你只需要继承`AbstractShardingDbContext`就可以了
 4. `IShardingTableDbContext`这个接口在你需要支持分表的情况下需要加，如果您只是分库那么就不需要添加这个接口
:::

### 创建虚拟路由

1. 订单表按月分表,这边我们把订单从2021年1月份开始到现在具体
```csharp

    //创建时间按月分表
    public class OrderVirtualTableRoute:AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute<Order>
    {
        public override DateTime GetBeginTime()
        {
            return new DateTime(2021, 1, 1);
        }
        //注意一定要配置或者采用接口+标签也是可以的
        public override void Configure(EntityMetadataTableBuilder<Order> builder)
        {
            builder.ShardingProperty(o => o.CreationTime);
        }
    }
    //用户Id取模3分表
    public class SysUserVirtualTableRoute:AbstractSimpleShardingModKeyStringVirtualTableRoute<SysUser>
    {
        public SysUserVirtualTableRoute() : base(2, 3)
        {
        }

        public override void Configure(EntityMetadataTableBuilder<SysUser> builder)
        {
            builder.ShardingProperty(o => o.Id);
        }
    }
```

### Startup配置
`ConfigureServices(IServiceCollection services)`配置
```csharp
        public void ConfigureServices(IServiceCollection services)
        {

            services.AddControllers();
            //添加一下代码
            services.AddShardingDbContext<MyDbContext>((conStr, builder) =>
                {
                    builder.UseSqlServer(conStr);
                }).Begin(op =>
                {
                    op.AutoTrackEntity = true;
                    //如果您使用code-first建议选择false
                    op.CreateShardingTableOnStart = true;
                    //如果您使用code-first建议修改为fsle
                    op.EnsureCreatedWithOutShardingTable = true;
                }).AddShardingTransaction((connection, builder) =>
                {
                    builder.UseSqlServer(connection);
                }).AddDefaultDataSource("ds0",
                    "Data Source=localhost;Initial Catalog=EFCoreShardingTableDB;Integrated Security=True;")
                .AddShardingTableRoute(op =>
                {
                    op.AddShardingTableRoute<SysUserVirtualTableRoute>();
                    op.AddShardingTableRoute<OrderVirtualTableRoute>();
                }).End();
        }
```
::: danger 重要
!!!`MyDbContext`请勿注册成单例、`ServiceLifetime.Singleton`!!!

!!!`MyDbContext`请勿注册成单例、`ServiceLifetime.Singleton`!!!

!!!`MyDbContext`请勿注册成单例、`ServiceLifetime.Singleton`!!!
:::


新建一个扩展方法用来初始化ShardingCore和初始化种子数据
```csharp
    public static class StartupExtension
    {
        public static void UseShardingCore(this IApplicationBuilder app)
        {
            app.ApplicationServices.GetRequiredService<IShardingBootstrapper>().Start();
        }
        public static void InitSeed(this IApplicationBuilder app)
        {
            using (var serviceScope = app.ApplicationServices.CreateScope())
            {
                var myDbContext = serviceScope.ServiceProvider.GetRequiredService<MyDbContext>();
                if (!myDbContext.Set<Setting>().Any())
                {
                    List<Setting> settings = new List<Setting>(3);
                    settings.Add(new Setting()
                    {
                        Code = "Admin",
                        Name = "AdminName"
                    });
                    settings.Add(new Setting()
                    {
                        Code = "User",
                        Name = "UserName"
                    });
                    settings.Add(new Setting()
                    {
                        Code = "SuperAdmin",
                        Name = "SuperAdminName"
                    });

                    List<SysUser> users = new List<SysUser>(10);
                    for (int i = 0; i < 10; i++)
                    {
                        var uer=new SysUser()
                        {
                            Id = i.ToString(),
                            Name = $"MyName{i}",
                            SettingCode = settings[i % 3].Code
                        };
                        users.Add(uer);
                    }
                    List<Order> orders = new List<Order>(300);
                    var begin = new DateTime(2021, 1, 1, 3, 3, 3);
                    for (int i = 0; i < 300; i++)
                    {

                        var order = new Order()
                        {
                            Id = i.ToString(),
                            Payer = $"{i % 10}",
                            Money = 100+new Random().Next(100,3000),
                            OrderStatus = (OrderStatusEnum)(i % 4 + 1),
                            CreationTime = begin.AddDays(i)
                        };
                        orders.Add(order);
                    }
                    myDbContext.AddRange(settings);
                    myDbContext.AddRange(users);
                    myDbContext.AddRange(orders);
                    myDbContext.SaveChanges();
                }
            }
        }
    }
```

`Configure(IApplicationBuilder app, IWebHostEnvironment env)`配置
```csharp
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            //初始化ShardingCore
            app.UseShardingCore();
            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
            //初始化种子数据
            app.InitSeed();
        }
```

### efcore日志(可选)
这边为了方便我们观察efcore的执行sql语句我们这边建议对efcore添加日志

```shell
PM> Install-Package Microsoft.Extensions.Logging.Console
``` 
`Startup`添加静态数据
```csharp
        public static readonly ILoggerFactory efLogger = LoggerFactory.Create(builder =>
        {
            builder.AddFilter((category, level) => category == DbLoggerCategory.Database.Command.Name && level == LogLevel.Information).AddConsole();
        });
```
在所有`builder.UseSqlServer(conStr);`

都改成`builder.UseSqlServer(conStr).UseLoggerFactory(efLogger);`

启动后我们将可以看到数据库和表会被自动创建，并且会将种子数据进行插入到内部供我们可以查询测试

## Demo
[EFCoreShardingTable](https://github.com/xuejmnet/ShardingCoreDocDemo/tree/main/EFCoreShardingTable)