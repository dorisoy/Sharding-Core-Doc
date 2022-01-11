---
icon: launch
title: 多租户
category: 多租户
---

## 背景
因为之前有小伙伴在使用`ShardingCore`的时候问过我是否可以利用ShardingCore的分库功能实现多租户呢，我的回答是可以的，但是需要针对分库对象进行路由的编写，相当于我一个项目需要实现多租户所有的表都需要实现分库才可以，那么这个在实际应用中将是不切实际的，所以虽然分库可以用来进行多租户但是一般没人会真的这样操作，那么就没有办法在ShardingCore使用合理的多租户外加分表分库了吗，针对这个问题`ShardingCore`在新的版本x.4.x.x+中进行了实现,[博客](https://www.cnblogs.com/xuejiaming/p/15782298.html)

## 功能
`ShardingCore`x.4.x.x+版本中具体实现了哪些功能呢
- 多配置支持,可以针对每个租户或者这个配置进行单独的分表分库读写分离的链接配置
- 多数据库配置，支持多配置下每个配置都可以拥有自己的数据库来进行分表分库读写分离
- 动态多配置，支持动态添加多配置(目前不支持动态删减多配置,后续会支持如果有需要)

## 场景
假设我们有这么一个多租户系统，这个系统在我们创建好账号后会分配给我们一个单独的数据库和对应的表信息,之后用户可以利用这个租户配置信息进行操作处理

## 首先我们创建一个AspNetCore的项目
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220109204747170-1484976526.png)
这边才用的.Net6版本的webapi

## 添加依赖

![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110135052157-537177258.png)

这边我们添加了三个包,分别是`ShardingCore`,`Microsoft.EntityFrameworkCore.SqlServer`,`Pomelo.EntityFrameworkCore.MySql`,其中`ShardingCore`用的是预览版的如果不勾选那么将无法显示出来,为什么我们需要添加额外的两个数据库驱动呢,原因是因为我们需要在不同的租户下实现不同的数据库的配置,比如租户A和我们签订的协议里面有说明系统使用开源数据库,或者希望使用Linux平台那么可以针对租户A进行配置`MySql`或者`PgSql`,租户B是资深软粉说需要使用`MSSQL`那么就可以针对其配置`MSSQL`.一般情况下我们可能不会出现多数据库的情况但是为了照顾到特殊情况我们这边也针对这种情况进行了支持。

## 公共用户存储
首先在我还没有创建租户的时候是不存在数据库的所以我的数据自然而然不会存在当前租户下,这边我们采用的是存储到其他数据库中,假设我们使用一个公共的数据库作为用户系统.
### 创建用户系统
创建系统用户和创建系统用户在数据库内的映射关系
```c#
    public class SysUser
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Password { get; set; }
        public DateTime CreationTime { get; set; }
        public bool IsDeleted { get; set; }
    }
    public class SysUserMap:IEntityTypeConfiguration<SysUser>
    {
        public void Configure(EntityTypeBuilder<SysUser> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(50);
            builder.Property(o => o.Name).IsRequired().HasMaxLength(50);
            builder.Property(o => o.Password).IsRequired().IsUnicode(false).HasMaxLength(50);
            builder.HasQueryFilter(o => o.IsDeleted == false);
            builder.ToTable(nameof(SysUser));
        }
    }
```
创建这个数据库该有的配置信息表，便于后期启动后重建
```c#
    public class SysUserTenantConfig
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        /// <summary>
        /// 添加ShardingCore配置的Json包
        /// </summary>
        public string ConfigJson { get; set; }
        public DateTime CreationTime { get; set; }
        public bool IsDeleted { get; set; }
    }
    public class SysUserTenantConfigMap:IEntityTypeConfiguration<SysUserTenantConfig>
    {
        public void Configure(EntityTypeBuilder<SysUserTenantConfig> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(50);
            builder.Property(o => o.UserId).IsRequired().IsUnicode(false).HasMaxLength(50);
            builder.Property(o => o.ConfigJson).IsRequired().HasMaxLength(2000);
            builder.HasQueryFilter(o => o.IsDeleted == false);
            builder.ToTable(nameof(SysUserTenantConfig));
        }
    }
```
创建对应的系统用户存储DbContext
```c#

    public class IdentityDbContext:DbContext
    {
        public IdentityDbContext(DbContextOptions<IdentityDbContext> options):base(options)
        {
            
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfiguration(new SysUserMap());
            modelBuilder.ApplyConfiguration(new SysUserTenantConfigMap());
        }
    }
```
### 创建一个租户的DbContext
```c#
    public class TenantDbContext:AbstractShardingDbContext,IShardingTableDbContext
    {
        public TenantDbContext(DbContextOptions<TenantDbContext> options) : base(options)
        {
        }

        public IRouteTail RouteTail { get; set; }
    }
```
目前我们先定义好后续进行编写内部的租户代码
### 创建动态租户参数
动态租户分片配置信息在`ShardingCore`只需要实现`IVirtualDataSourceConfigurationParams<TShardingDbContext>`接口,但是这个接口有很多参数需要填写,所以这边框架针对这个接口进行了默认参数的抽象类`AbstractVirtualDataSourceConfigurationParams<TShardingDbContext>`。
这边我们针对配置参数进行配置采用新建一个配置json的对象
```c#
    public class ShardingTenantOptions
    {
        public  string ConfigId { get; set;}
        public  int Priority { get; set;}
        public  string DefaultDataSourceName { get; set;}
        public  string DefaultConnectionString { get; set;}
        public DbTypeEnum DbType { get; set; }
    }
```
参数里面配置了当前数据库,这边比较简单我们就暂时使用单表分库的模式来实现,目前暂时不对每个租户分库进行演示。之后并且编写`SqlServer`和`MySql`的配置支持
```c#

    public class SqlShardingConfiguration : AbstractVirtualDataSourceConfigurationParams<TenantDbContext>
    {
        private static readonly ILoggerFactory efLogger = LoggerFactory.Create(builder =>
        {
            builder.AddFilter((category, level) => category == DbLoggerCategory.Database.Command.Name && level == LogLevel.Information).AddConsole();
        });
        public override string ConfigId { get; }
        public override int Priority { get; }
        public override string DefaultDataSourceName { get; }
        public override string DefaultConnectionString { get; }
        public override ITableEnsureManager TableEnsureManager { get; }

        private readonly DbTypeEnum _dbType;
        public SqlShardingConfiguration(ShardingTenantOptions options)
        {
            ConfigId = options.ConfigId;
            Priority = options.Priority;
            DefaultDataSourceName = options.DefaultDataSourceName;
            DefaultConnectionString = options.DefaultConnectionString;
            _dbType = options.DbType;
            //用来快速判断是否存在数据库中的表
            if (_dbType == DbTypeEnum.MSSQL)
            {
                TableEnsureManager = new SqlServerTableEnsureManager<TenantDbContext>();
            }
            else if (_dbType == DbTypeEnum.MYSQL)
            {
                TableEnsureManager = new MySqlTableEnsureManager<TenantDbContext>();
            }
            else
            {
                throw new NotImplementedException();
            }
        }
        public override DbContextOptionsBuilder UseDbContextOptionsBuilder(string connectionString,
            DbContextOptionsBuilder dbContextOptionsBuilder)
        {
            switch (_dbType)
            {
                case DbTypeEnum.MSSQL:
                    {
                        dbContextOptionsBuilder.UseSqlServer(connectionString).UseLoggerFactory(efLogger);
                    }
                    break;
                case DbTypeEnum.MYSQL:
                    {
                        dbContextOptionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version())).UseLoggerFactory(efLogger);
                    }
                    break;
                default: throw new NotImplementedException();
            }
            return dbContextOptionsBuilder;
        }

        public override DbContextOptionsBuilder UseDbContextOptionsBuilder(DbConnection dbConnection,
            DbContextOptionsBuilder dbContextOptionsBuilder)
        {
            switch (_dbType)
            {
                case DbTypeEnum.MSSQL:
                {
                    dbContextOptionsBuilder.UseSqlServer(dbConnection).UseLoggerFactory(efLogger);
                    }
                    break;
                case DbTypeEnum.MYSQL:
                {
                    dbContextOptionsBuilder.UseMySql(dbConnection, new MySqlServerVersion(new Version())).UseLoggerFactory(efLogger);
                    }
                    break;
                default: throw new NotImplementedException();
            }
            return dbContextOptionsBuilder;
        }
    }
```
### 编写用户注册接口
```c#

    [Route("api/[controller]/[action]")]
    [ApiController]
    [AllowAnonymous]
    public class PassportController:ControllerBase
    {
        private readonly IdentityDbContext _identityDbContext;

        public PassportController(IdentityDbContext identityDbContext)
        {
            _identityDbContext = identityDbContext;
        }
        [HttpPost]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            if (await _identityDbContext.Set<SysUser>().AnyAsync(o => o.Name == request.Name))
                return BadRequest("user not exists");
            var sysUser = new SysUser()
            {
                Id = Guid.NewGuid().ToString("n"),
                Name = request.Name,
                Password = request.Password,
                CreationTime=DateTime.Now
            };
            var shardingTenantOptions = new ShardingTenantOptions()
            {
                ConfigId = sysUser.Id,
                Priority = new Random().Next(1,10),
                DbType = request.DbType,
                DefaultDataSourceName = "ds0",
                DefaultConnectionString = GetDefaultString(request.DbType,sysUser.Id)
            };
            var sysUserTenantConfig = new SysUserTenantConfig()
            {
                Id = Guid.NewGuid().ToString("n"),
                UserId = sysUser.Id,
                CreationTime = DateTime.Now,
                ConfigJson = JsonConvert.SerializeObject(shardingTenantOptions)
            };
            await _identityDbContext.AddAsync(sysUser);
            await _identityDbContext.AddAsync(sysUserTenantConfig);
            await _identityDbContext.SaveChangesAsync();
            //注册完成后进行配置生成
            DynamicShardingHelper.DynamicAppendVirtualDataSourceConfig(new SqlShardingConfiguration(shardingTenantOptions));
            return Ok();
        }
        [HttpPost]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var sysUser = await _identityDbContext.Set<SysUser>().FirstOrDefaultAsync(o=>o.Name==request.Name&&o.Password==request.Password);
            if (sysUser == null)
                return BadRequest("name or password error");

            //秘钥，就是标头，这里用Hmacsha256算法，需要256bit的密钥
            var securityKey = new SigningCredentials(new SymmetricSecurityKey(Encoding.ASCII.GetBytes("123123!@#!@#123123")), SecurityAlgorithms.HmacSha256);
            //Claim，JwtRegisteredClaimNames中预定义了好多种默认的参数名，也可以像下面的Guid一样自己定义键名.
            //ClaimTypes也预定义了好多类型如role、email、name。Role用于赋予权限，不同的角色可以访问不同的接口
            //相当于有效载荷
            var claims = new Claim[] {
                new Claim(JwtRegisteredClaimNames.Iss,"https://localhost:5000"),
                new Claim(JwtRegisteredClaimNames.Aud,"api"),
                new Claim("id",Guid.NewGuid().ToString("n")),
                new Claim("uid",sysUser.Id),
            };
            SecurityToken securityToken = new JwtSecurityToken(
                signingCredentials: securityKey,
                expires: DateTime.Now.AddHours(2),//过期时间
                claims: claims
            );
            var token = new JwtSecurityTokenHandler().WriteToken(securityToken);
            return Ok(token);
        }

        private string GetDefaultString(DbTypeEnum dbType, string userId)
        {
            switch (dbType)
            {
                case DbTypeEnum.MSSQL: return $"Data Source=localhost;Initial Catalog=DB{userId};Integrated Security=True;";
                case DbTypeEnum.MYSQL: return $"server=127.0.0.1;port=3306;database=DB{userId};userid=root;password=L6yBtV6qNENrwBy7;";
                default: throw new NotImplementedException();
            }
        }
    }
    
    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Password { get; set; }
        public DbTypeEnum DbType { get; set; }
    }

    public class LoginRequest
    {
        public string Name { get; set; }
        public string Password { get; set; }
    }
```
简单来说明一下,这边我们采用的是用户的id作为租户id,将租户id作为数据库配置,来支持多配置模式。到此为止我们的用户系统就已经完成了是不是十分的简单仅仅几段代码,用户这边注册完成后将会创建对应的数据库和对应的表,如果你是分表的那么将会自动创建对应的数据库表等信息。
## 租户系统
租户系统我们做一个订单的简单演示,使用订单id取模,取模取5来进行分表操作
### 新增租户系统的订单信息
```c#
    public class Order
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public DateTime CreationTime { get; set; }
        public bool IsDeleted { get; set; }
    }
    public class OrderMap:IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).IsRequired().IsUnicode(false).HasMaxLength(50);
            builder.Property(o => o.Name).IsRequired().HasMaxLength(100);
            builder.HasQueryFilter(o => o.IsDeleted == false);
            builder.ToTable(nameof(Order));
        }
    }
```
### 新增订单路由
```c#
public class OrderVirtualTableRoute:AbstractSimpleShardingModKeyStringVirtualTableRoute<Order>
{
      public OrderVirtualTableRoute() : base(2, 5)
      {
      }

      public override void Configure(EntityMetadataTableBuilder<Order> builder)
      {
          builder.ShardingProperty(o => o.Id);
      }
}
```
简单的字符串取模
### 添加租户中间件
添加租户中间件,在系统中如果使用多配置那么就必须要指定本次创建的dbcontext使用的是哪个配置
```c#

    public class TenantSelectMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IVirtualDataSourceManager<TenantDbContext> _virtualDataSourceManager;

        public TenantSelectMiddleware(RequestDelegate next, IVirtualDataSourceManager<TenantDbContext> virtualDataSourceManager)
        {
            _next = next;
            _virtualDataSourceManager = virtualDataSourceManager;
        }

        public async Task Invoke(HttpContext context)
        {

            if (context.Request.Path.ToString().StartsWith("/api/tenant", StringComparison.CurrentCultureIgnoreCase))
            {
                if (!context.User.Identity.IsAuthenticated)
                {
                    await DoUnAuthorized(context, "not found tenant id");
                    return;
                }

                var tenantId = context.User.Claims.FirstOrDefault((o) => o.Type == "uid")?.Value;
                if (string.IsNullOrWhiteSpace(tenantId))
                {
                    await DoUnAuthorized(context, "not found tenant id");
                    return;
                }

                using (_virtualDataSourceManager.CreateScope(tenantId))
                {
                    await _next(context);
                }
            }
            else
            {
                await _next(context);
            }
        }

        private async Task DoUnAuthorized(HttpContext context, string msg)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsync(msg);
        }
    }
```
该中间件拦截`/api/tenant`路径下的所有请求并且针对这些请求添加对应的租户信息
### 配置租户扩展初始化数据
```c#

    public static class TenantExtension
    {
        public static void InitTenant(this IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var identityDbContext = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
                identityDbContext.Database.EnsureCreated();
                var sysUserTenantConfigs = identityDbContext.Set<SysUserTenantConfig>().ToList();
                if (sysUserTenantConfigs.Any())
                {
                    foreach (var sysUserTenantConfig in sysUserTenantConfigs)
                    {
                        var shardingTenantOptions = JsonConvert.DeserializeObject<ShardingTenantOptions>(sysUserTenantConfig.ConfigJson);
                        DynamicShardingHelper.DynamicAppendVirtualDataSourceConfig(
                            new SqlShardingConfiguration(shardingTenantOptions));
                    }
                }
            }
        }
    }
```
这边因为我们针对租户信息进行了初始化而不是硬编码,所以需要一个在启动的时候对租户信息进行动态添加
### 配置多租户
启动配置`Startup`
```c#

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddAuthentication();
#region 用户系统配置

builder.Services.AddDbContext<IdentityDbContext>(o =>
    o.UseSqlServer("Data Source=localhost;Initial Catalog=IdDb;Integrated Security=True;"));
//生成密钥
var keyByteArray = Encoding.ASCII.GetBytes("123123!@#!@#123123");
var signingKey = new SymmetricSecurityKey(keyByteArray);
//认证参数
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = "https://localhost:5000",
            ValidateAudience = true,
            ValidAudience = "api",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            RequireExpirationTime = true,
        };
    });
#endregion
#region 配置ShardingCore
builder.Services.AddShardingDbContext<TenantDbContext>()
    .AddEntityConfig(op =>
    {
        op.CreateShardingTableOnStart = true;
        op.EnsureCreatedWithOutShardingTable = true;
        op.AddShardingTableRoute<OrderVirtualTableRoute>();
    })
    .AddConfig(op =>
    {
        //默认配置一个
        op.ConfigId = $"test_{Guid.NewGuid():n}";
        op.Priority = 99999;
        op.AddDefaultDataSource("ds0", "Data Source=localhost;Initial Catalog=TestTenantDb;Integrated Security=True;");
        op.UseShardingQuery((conStr, b) =>
        {
            b.UseSqlServer(conStr);
        });
        op.UseShardingTransaction((conn, b) =>
        {
            b.UseSqlServer(conn);
        });
    }).EnsureMultiConfig(ShardingConfigurationStrategyEnum.ThrowIfNull);

#endregion

var app = builder.Build();

// Configure the HTTP request pipeline.
app.Services.GetRequiredService<IShardingBootstrapper>().Start();
//初始化启动配置租户信息
app.Services.InitTenant();
app.UseAuthorization();
app.UseAuthorization();
//在认证后启用租户选择中间件
app.UseMiddleware<TenantSelectMiddleware>();

app.MapControllers();

app.Run();

```
### 编写租户操作
```c#

    [Route("api/tenant/[controller]/[action]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "Bearer")]
    public class TenantController : ControllerBase
    {
        private readonly TenantDbContext _tenantDbContext;

        public TenantController(TenantDbContext tenantDbContext)
        {
            _tenantDbContext = tenantDbContext;
        }
        public async Task<IActionResult> AddOrder()
        {
            var order = new Order()
            {
                Id = Guid.NewGuid().ToString("n"),
                CreationTime = DateTime.Now,
                Name = new Random().Next(1,100)+"_name"
            };
            await _tenantDbContext.AddAsync(order);
            await _tenantDbContext.SaveChangesAsync();
            return Ok(order.Id);
        }
        public async Task<IActionResult> UpdateOrder([FromQuery]string id)
        {
            var order =await _tenantDbContext.Set<Order>().FirstOrDefaultAsync(o=>o.Id==id);
            if (order == null) return BadRequest();
            order.Name = new Random().Next(1, 100) + "_name";
            await _tenantDbContext.SaveChangesAsync();
            return Ok(order.Id);
        }
        public async Task<IActionResult> GetOrders()
        {
            var orders =await _tenantDbContext.Set<Order>().ToListAsync();
            return Ok(orders);
        }
    }
```
## 启动项目
这边我们基本上已经配置好我们所需要的之后我们就可以直接启动项目了
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110213028837-1684806586.png)

这边我们通过接口注册了一个TenantA的用户并且选择了使用MSSQL,这边成就帮我们自动生成好了对应的数据库表结构
接下来我么再注册一个TenantB用户选择MySql
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110213234665-1363047961.png)

通过截图我们可以看到`ShardingCore`也是为我们创建好了对应的数据库和对应的表信息
## 登录租户
首先我们登录

TenantA用户token
```shell
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiYXBpIiwiaWQiOiJkNGMwZjZiNzI5MzE0M2VlYWM0Yjg3NzUwYzE4MWUzOSIsInVpZCI6ImMxMWRkZjFmNTY0MjQwZjc5YTQzNTEzZGMwNmVjZGMxIiwiZXhwIjoxNjQxODI4ODQ0fQ.zJefwnmcIEZm-kizlN7DhwTRgGxiCg52Esa8QmHiEKY
```
TenantB用户token
```shell
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiYXBpIiwiaWQiOiIwNzY4NzUwMmVjYzY0NTMyOGFkNTcwZDRkYjMwNDI3MSIsInVpZCI6ImVkODg4YTc3MzAwYTQ4NjZhYmUyNWY2MTE1NmEwZTQzIiwiZXhwIjoxNjQxODI4ODgxfQ.cL0d010jdXLXNGT8M0wsRMqn3VeIxFnV0keM0H3SPzo
```
接下来我们分别对两个租户进行交叉处理

### AddOrder
租户A插入一个订单,订单Id：`aef6905f512a4f72baac5f149ef32d21`
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110214024317-2049319166.png)

TenantB用户也插入一个订单,订单id:`450f5dd0e82442eca33dfcf3d57fafa3`
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110214159011-2067776275.png)
两个用户处理
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110214520461-1662296101.png)

通过日志打印明显能够感觉出来两者是区分了不同的数据库
### UpdateOrder
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110214426755-139567743.png)


### GetOrders
![](https://img2020.cnblogs.com/blog/1346660/202201/1346660-20220110214805352-462848018.png)


## 总结
通过上述功能的演示相信很多小伙伴应该已经知道他具体的运作流程了,通过配置多个租户信息,在`ShardingCore`上实现多配置,动态配置,来保证在多租户模式下的分表分库读写分离依然可以使用,并且拥有跟好的适泛性。
如果你需要开发一个大型程序,领导上来就是分库分表,那么在以前大概率是会花费非常多的精力在处理分片这件事情上,而最终项目是否可以做完并且使用还是一个巨大的问题,但是现在不一样了,毕竟`ShardingCore`之前并没有一款非常好用的分片组件在.net上,并且拥有非常完美的orm作为支持，基本上重来没有一个框架说多租户模式是可以选择数据库的,之前市面上所有的多租户你只能选择一种数据库,目前.Net在开源的状态下我相信会有越来越好的组件框架诞生,毕竟这么好的语言如果配上丰富的生态那将是所有.Neter的福音。
