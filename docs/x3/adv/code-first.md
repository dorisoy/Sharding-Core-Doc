---
icon: launch
title: Code First
category: 高级
---

## 介绍
用过efcore的小伙伴肯定都知道code first是很久之前就一直在主打的一种编程方式,他可以让我们直接上手编程,而不需要去构建数据库,以一种先写代码后自动创建数据库的模式让开发者从数据库设计中脱离出来，更多的是快速进入到开发的一种状态。

## 安装
首先无论你是aspnetcore还是普通的控制台程序，我们这边需要做的是新建一个控制台程序，命名为`Project.Migrations`,如果您是分层架构，那么请对当前的控制台程序进行`efcore`所在层的类库进行引用。引用的类库如果不存在`sharding-core`也请安装上。最后安装`Microsoft.EntityFrameworkCore.Tools`请选择对应的`efcore`对应版本

```shell
dotnet add package Microsoft.EntityFrameworkCore.Tools
```

## 开始
首先efcore分为以下几步
首先我们创建几个对象分别是分表和部分表的对象，分表对象又分取模和时间分表
### 创建对象
如果是项目引入efcore层可以忽略
```csharp

    public class NoShardingTable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
    }
    
    public class ShardingWithDateTime
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
        public DateTime CreateTime { get; set; }
    }
    
    public class ShardingWithMod
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
        public string TextStr { get; set; }
        public string TextStr1 { get; set; }
        public string TextStr2 { get; set; }
    }
```

### 创建数据库关系
如果是项目引入efcore层可以忽略
```csharp

    public class NoShardingTableMap : IEntityTypeConfiguration<NoShardingTable>
    {
        public void Configure(EntityTypeBuilder<NoShardingTable> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(128);
            builder.Property(o => o.Name).HasMaxLength(128);
            builder.ToTable(nameof(NoShardingTable));
        }
    }
    public class ShardingWithDateTimeMap : IEntityTypeConfiguration<ShardingWithDateTime>
    {
        public void Configure(EntityTypeBuilder<ShardingWithDateTime> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(128);
            builder.Property(o => o.Name).HasMaxLength(128);
            builder.ToTable(nameof(ShardingWithDateTime));
        }
    }
    public class ShardingWithModMap : IEntityTypeConfiguration<ShardingWithMod>
    {
        public void Configure(EntityTypeBuilder<ShardingWithMod> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(128);
            builder.Property(o => o.Name).HasMaxLength(128);
            builder.Property(o => o.Name).HasMaxLength(128);
            builder.Property(o => o.TextStr).IsRequired().HasMaxLength(128).HasDefaultValue("");
            builder.Property(o => o.TextStr1).IsRequired().HasMaxLength(128).HasDefaultValue("123");
            builder.Property(o => o.TextStr2).IsRequired().HasMaxLength(128).HasDefaultValue("123");
            builder.ToTable(nameof(ShardingWithMod));
        }
    }
```
### 创建dbcontext
如果是项目引入efcore层可以忽略

创建dbcontext并且建立关系
```csharp

    public class DefaultShardingTableDbContext:AbstractShardingDbContext, IShardingTableDbContext
    {
        public DefaultShardingTableDbContext(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfiguration(new NoShardingTableMap());
            modelBuilder.ApplyConfiguration(new ShardingWithModMap());
            modelBuilder.ApplyConfiguration(new ShardingWithDateTimeMap());
        }

        public IRouteTail RouteTail { get; set; }
    }
```

### 分表路由
如果引用的层里有对应的可以忽略
```csharp

    public class ShardingWithModVirtualTableRoute : AbstractSimpleShardingModKeyStringVirtualTableRoute<ShardingWithMod>
    {
        public ShardingWithModVirtualTableRoute() : base(2, 3)
        {
        }

        public override void Configure(EntityMetadataTableBuilder<ShardingWithMod> builder)
        {
            builder.ShardingProperty(o => o.Id);
        }
    }
    public class ShardingWithDateTimeVirtualTableRoute : AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute<ShardingWithDateTime>
    {
        public override DateTime GetBeginTime()
        {
            return new DateTime(2021, 9, 1);
        }

        public override void Configure(EntityMetadataTableBuilder<ShardingWithDateTime> builder)
        {
            builder.ShardingProperty(o => o.CreateTime);
        }
    }
```
### SqlGenerator

我们需要对迁移sql生成进行重写,假如我们是`SqlServer`,`MySql`亦是如此

```csharp

    public class ShardingSqlServerMigrationsSqlGenerator<TShardingDbContext> : SqlServerMigrationsSqlGenerator where TShardingDbContext:DbContext,IShardingDbContext
    {
        public ShardingSqlServerMigrationsSqlGenerator(MigrationsSqlGeneratorDependencies dependencies, IRelationalAnnotationProvider migrationsAnnotations) : base(dependencies, migrationsAnnotations)
        {
        }
        protected override void Generate(
            MigrationOperation operation,
            IModel model,
            MigrationCommandListBuilder builder)
        {
            //获取老旧命令
            var oldCmds = builder.GetCommandList().ToList();
            base.Generate(operation, model, builder);
            //获取新的命令
            var newCmds = builder.GetCommandList().ToList();
            //比较判断获取增量命令
            var addCmds = newCmds.Where(x => !oldCmds.Contains(x)).ToList();
            //替换增量命令下的表名为表名+后缀
            MigrationHelper.Generate<TShardingDbContext>(operation, builder, Dependencies.SqlGenerationHelper, addCmds);
        }
    }
```


### 创建设计
创建ShardingDesignTimeDbContextFactory来继承`IDesignTimeDbContextFactory<TDbContext>`
```csharp

    public class DefaultDesignTimeDbContextFactory: IDesignTimeDbContextFactory<DefaultShardingTableDbContext>
    { 
        static DefaultDesignTimeDbContextFactory()
        {
            var services = new ServiceCollection();
            services.AddShardingDbContext<DefaultShardingTableDbContext>(
                    (conn, o) =>
                        o.UseSqlServer(conn)
                            .ReplaceService<IMigrationsSqlGenerator, ShardingSqlServerMigrationsSqlGenerator<DefaultShardingTableDbContext>>()
                ).Begin(o =>
                {
                    o.CreateShardingTableOnStart = false;
                    o.EnsureCreatedWithOutShardingTable = false;
                })
                .AddShardingTransaction((connection, builder) =>
                    builder.UseSqlServer(connection))
                .AddDefaultDataSource("ds0",
                    "Data Source=localhost;Initial Catalog=ShardingCoreDBMigration;Integrated Security=True;")
                .AddShardingTableRoute(o =>
                {
                    o.AddShardingTableRoute<ShardingWithModVirtualTableRoute>();
                    o.AddShardingTableRoute<ShardingWithDateTimeVirtualTableRoute>();
                }).End();
            services.AddLogging();
            var buildServiceProvider = services.BuildServiceProvider();
            ShardingContainer.SetServices(buildServiceProvider);
            ShardingContainer.GetService<IShardingBootstrapper>().Start();
        }

        public DefaultShardingTableDbContext CreateDbContext(string[] args)
        {
            return ShardingContainer.GetService<DefaultShardingTableDbContext>();
        }
    }
```
简单说明一下静态构造函数里处理的事情`static DefaultDesignTimeDbContextFactory()`第一步进行了配置，并且对配置完成后进行了启动(初始化),初始化完成后可以通过`ShardingContainer`或者`IServiceProvider`进行`DbContext`的获取.

::: warning 注意
如果你是一个aspnetcore的项目，那么请务必新建一个控制台程序然后引用efcore层来处理，因为默认`efcore-tools`的执行是在startup中寻找，但是发现有efcore的初始化会直接拿来使用，但是并不会执行`Configure`也就是说`sharding-core`并不会被初始化，就无法被正确处理。
:::


## 生成迁移文件

### 打开nuget命令
<img src="/sharding-core-doc/nuget.png">

### 设置启动项
<img src="/sharding-core-doc/setm.png">

### 迁移初始化命令
```shell
PM> Add-Migration InitSharding
```
如果控制台出现迁移文件就说明迁移成功

### 更新到数据库
```shell
PM> update-Database
```

### 生产环境
```shell
PM> Script-Migration
```
如果是生产环境更多的是通过生成脚本来进行手动处理执行

具体可以参考[Sample.Migrations](https://github.com/xuejmnet/sharding-core/tree/main/samples/Sample.Migrations)