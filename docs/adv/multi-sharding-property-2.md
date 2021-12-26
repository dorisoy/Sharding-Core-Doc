---
icon: launch
title: 多字段分片2
category: 高级
---

## 背景
直接开门见山,你有没有这种情况你需要将一批数据用时间分片来进行存储比如订单表,订单表的分片字段是订单的`创建时间`,并且id是`雪花id`，`订单编号`是带时间信息的编号,因为.net下的所有分片方案几乎都是只支持单分片字段,所以当我们不使用分片字段查询也就是订单创建时间查询的话会带来全表查询,导致性能下降,譬如我想用`雪花id`或者`订单编号`进行查询，但是带来的却是内部低效的结果,针对这种情况是否有一个好的解决方案呢,有但是需要侵入业务代码,根据雪花id或者订单编号进行解析出对应的时间然后`手动指定分片`前提是框架支持`手动指定`.基于上述原因[`ShardingCore`](https://github.com/xuejmnet/sharding-core) 带来了全新版本 x.3.2.x+ 支持多字段分片路由,并且拥有很完美的实现,废话不多说我们直接开始吧！！！！！！！！！！！

## 原理
我们现在假定一个很简单的场景,依然是订单时间按月分片,查询进行如下语句
```c#
          //这边演示不使用雪花id因为雪花id很难在演示中展示所以使用订单编号进行演示格式:yyyyMMddHHmmss+new Random().Next(0,10000).ToString().PadLeft(4,'0')
            var dateTime = new DateTime(2021, 11, 1);
            var order = await _myDbContext.Set<Order>().Where(o => o.OrderNo== 202112201900001111&&o.CreateTime< dateTime).FirstOrDefaultAsync();
```
上述语句OrderNo会查询Order_202112这张表，然后时间索引会查询......Order_202108、Order_202109、Order_202110,然后两者取一个交集我们发现其实是没有结果的,这个时候应该是返回默认值null或者直接报错
这就是一个简单的原理

## 直接开始
接下来我将用订单编号和创建时间来为大演示,数据库采用sqlserve(你也可以换成任意efcore支持的数据库),其中编号格式yyyyMMddHHmmss+new Random().Next(0,10000).ToString().PadLeft(4,'0'),创建时间是DateTime格式并且创建时间按月分表,这边不采用雪花id是因为雪花id的实现会根据workid和centerid的不一样而出现不一样的效果,接下来我们通过简单的5步操作实现多字段分片
### 添加依赖
首先我们添加两个依赖,一个是`ShardingCore`一个`EFCore.SqlServer`
```shell
//请安装最新版本目前x.3.2.x+,第一个版本号6代表efcore的版本号
Install-Package ShardingCore -Version 6.3.2

Install-Package Microsoft.EntityFrameworkCore.SqlServer -Version 6.0.1
```

![](https://img2020.cnblogs.com/blog/1346660/202112/1346660-20211225093421886-2131126936.png)

![](https://img2020.cnblogs.com/blog/1346660/202112/1346660-20211225093505145-1192048101.png)


### 创建一个订单对象
```c#

    public class Order
    {
        public string Id { get; set; }
        public string OrderNo { get; set; }
        public string Name { get; set; }
        public DateTime CreateTime { get; set; }
    }
```
### 创建DbContext
这边就简单的创建了一个dbcontext,并且设置了一下order如何映射到数据库,当然你可以采用attribute的方式而不是一定要fluentapi
```c#

    /// <summary>
    /// 如果需要支持分表必须要实现<see cref="IShardingTableDbContext"/>
    /// </summary>
    public class DefaultDbContext:AbstractShardingDbContext,IShardingTableDbContext
    {
        public DefaultDbContext(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Order>(o =>
            {
                o.HasKey(p => p.Id);
                o.Property(p => p.OrderNo).IsRequired().HasMaxLength(128).IsUnicode(false);
                o.Property(p => p.Name).IsRequired().HasMaxLength(128).IsUnicode(false);
                o.ToTable(nameof(Order));
            });
        }

        public IRouteTail RouteTail { get; set; }
    }
```

### 创建分片路由
这边我们采用订单创建时间按月分表
```c#

    public class OrderVirtualRoute : AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute<Order>
    {
        /// <summary>
        /// 配置主分表字段是CreateTime,额外分表字段是OrderNo
        /// </summary>
        /// <param name="builder"></param>
        public override void Configure(EntityMetadataTableBuilder<Order> builder)
        {
            builder.ShardingProperty(o => o.CreateTime);
            builder.ShardingExtraProperty(o => o.OrderNo);
        }
        /// <summary>
        /// 是否要在程序运行期间自动创建每月的表
        /// </summary>
        /// <returns></returns>
        public override bool AutoCreateTableByTime()
        {
            return true;
        }
        /// <summary>
        /// 分表从何时起创建
        /// </summary>
        /// <returns></returns>
        public override DateTime GetBeginTime()
        {
            return new DateTime(2021, 9, 1);
        }
        /// <summary>
        /// 配置额外分片路由规则
        /// </summary>
        /// <param name="shardingKey"></param>
        /// <param name="shardingOperator"></param>
        /// <param name="shardingPropertyName"></param>
        /// <returns></returns>
        public override Expression<Func<string, bool>> GetExtraRouteFilter(object shardingKey, ShardingOperatorEnum shardingOperator, string shardingPropertyName)
        {
            switch (shardingPropertyName)
            {
                case nameof(Order.OrderNo): return GetOrderNoRouteFilter(shardingKey, shardingOperator);
                default: throw new NotImplementedException(shardingPropertyName);
            }
        }
        /// <summary>
        /// 订单编号的路由
        /// </summary>
        /// <param name="shardingKey"></param>
        /// <param name="shardingOperator"></param>
        /// <returns></returns>
        public Expression<Func<string, bool>> GetOrderNoRouteFilter(object shardingKey,
            ShardingOperatorEnum shardingOperator)
        {
            //将分表字段转成订单编号
            var orderNo = shardingKey?.ToString() ?? string.Empty;
            //判断订单编号是否是我们符合的格式
            if (!CheckOrderNo(orderNo, out var orderTime))
            {
                //如果格式不一样就直接返回false那么本次查询因为是and链接的所以本次查询不会经过任何路由,可以有效的防止恶意攻击
                return tail => false;
            }

            //当前时间的tail
            var currentTail = TimeFormatToTail(orderTime);
            //因为是按月分表所以获取下个月的时间判断id是否是在临界点创建的
            var nextMonthFirstDay = ShardingCoreHelper.GetNextMonthFirstDay(DateTime.Now);
            if (orderTime.AddSeconds(10) > nextMonthFirstDay)
            {
                var nextTail = TimeFormatToTail(nextMonthFirstDay);
                return DoOrderNoFilter(shardingOperator, orderTime, currentTail, nextTail);
            }
            //因为是按月分表所以获取这个月月初的时间判断id是否是在临界点创建的
            if (orderTime.AddSeconds(-10) < ShardingCoreHelper.GetCurrentMonthFirstDay(DateTime.Now))
            {
                //上个月tail
                var previewTail = TimeFormatToTail(orderTime.AddSeconds(-10));

                return DoOrderNoFilter(shardingOperator, orderTime, previewTail, currentTail);
            }

            return DoOrderNoFilter(shardingOperator, orderTime, currentTail, currentTail);

        }

        private Expression<Func<string, bool>> DoOrderNoFilter(ShardingOperatorEnum shardingOperator, DateTime shardingKey, string minTail, string maxTail)
        {
            switch (shardingOperator)
            {
                case ShardingOperatorEnum.GreaterThan:
                case ShardingOperatorEnum.GreaterThanOrEqual:
                    {
                        return tail => String.Compare(tail, minTail, StringComparison.Ordinal) >= 0;
                    }

                case ShardingOperatorEnum.LessThan:
                    {
                        var currentMonth = ShardingCoreHelper.GetCurrentMonthFirstDay(shardingKey);
                        //处于临界值 o=>o.time < [2021-01-01 00:00:00] 尾巴20210101不应该被返回
                        if (currentMonth == shardingKey)
                            return tail => String.Compare(tail, maxTail, StringComparison.Ordinal) < 0;
                        return tail => String.Compare(tail, maxTail, StringComparison.Ordinal) <= 0;
                    }
                case ShardingOperatorEnum.LessThanOrEqual:
                    return tail => String.Compare(tail, maxTail, StringComparison.Ordinal) <= 0;
                case ShardingOperatorEnum.Equal:
                    {
                        var isSame = minTail == maxTail;
                        if (isSame)
                        {
                            return tail => tail == minTail;
                        }
                        else
                        {
                            return tail => tail == minTail || tail == maxTail;
                        }
                    }
                default:
                    {
                        return tail => true;
                    }
            }
        }

        private bool CheckOrderNo(string orderNo, out DateTime orderTime)
        {
            //yyyyMMddHHmmss+new Random().Next(0,10000).ToString().PadLeft(4,'0')
            if (orderNo.Length == 18)
            {
                if (DateTime.TryParseExact(orderNo.Substring(0, 14), "yyyyMMddHHmmss", CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out var parseDateTime))
                {
                    orderTime = parseDateTime;
                    return true;
                }
            }

            orderTime = DateTime.MinValue;
            return false;
        }
    }
```
这边我来讲解一下为什么用额外字段分片需要些这么多代码呢,其实是这样的因为你是用订单创建时间`CreateTime`来进行分片的那么`CreateTime`和`OrderNo`的赋值原理上说应该在系统里面是不可能实现同一时间赋值的肯定有先后关系可能是几微妙甚至几飞秒,但是为了消除这种差异这边采用了临界点兼容算法来实现，让我们来看下一下代码
```c#
var order=new Order()
//执行这边生成出来的id是2021-11-30 23:59:59.999.999
order.Id="xxx";
//business code //具体执行时间不确定,哪怕没有business code也没有办法保证两者生成的时间一致,当然如果你可以做到一致完全不需要这么复杂的编写
............
//执行这边生成出来的时间是2021-12-01 00:00:00.000.000
order.CreateTime=DateTime.Now;
```
当然系统里面采用了前后添加10秒是一个比较保守的估算你可以采用前后一秒甚至几百毫秒都是ok的,具体业务具体实现,因为大部分的创建时间可能是由框架在提交后才会生成而不是new Order的时候,当然也不排除这种情况,当然如果你只需要考虑equal一种情况可以只编写equal的判断而不需要全部情况都考虑
### ShardingCore启动配置
```c#
ILoggerFactory efLogger = LoggerFactory.Create(builder =>
{
    builder.AddFilter((category, level) => category == DbLoggerCategory.Database.Command.Name && level == LogLevel.Information).AddConsole();
});
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddShardingDbContext<DefaultDbContext>((conStr,builder)=>builder
        .UseSqlServer(conStr)
        .UseLoggerFactory(efLogger)
    )
    .Begin(o =>
    {
        o.CreateShardingTableOnStart = true;
        o.EnsureCreatedWithOutShardingTable = true;
    }).AddShardingTransaction((connection, builder) =>
    {
        builder.UseSqlServer(connection).UseLoggerFactory(efLogger);
    }).AddDefaultDataSource("ds0","Data Source=localhost;Initial Catalog=ShardingMultiProperties;Integrated Security=True;")//如果你是sqlserve只需要修改这边的链接字符串即可
    .AddShardingTableRoute(op =>
    {
        op.AddShardingTableRoute<OrderVirtualRoute>();
    })
    .AddTableEnsureManager(sp=>new SqlServerTableEnsureManager<DefaultDbContext>())//告诉ShardingCore启动时有哪些表
    .End();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.Services.GetRequiredService<IShardingBootstrapper>().Start();

app.UseAuthorization();

app.MapControllers();

//额外添加一些种子数据
using (var serviceScope = app.Services.CreateScope())
{
    var defaultDbContext = serviceScope.ServiceProvider.GetService<DefaultDbContext>();
    if (!defaultDbContext.Set<Order>().Any())
    {
        var orders = new List<Order>(8);
        var beginTime = new DateTime(2021, 9, 5);
        for (int i = 0; i < 8; i++)
        {

            var orderNo = beginTime.ToString("yyyyMMddHHmmss") + i.ToString().PadLeft(4, '0');
            orders.Add(new Order()
            {
                Id = Guid.NewGuid().ToString("n"),
                CreateTime = beginTime,
                Name = $"Order" + i,
                OrderNo = orderNo
            });
            beginTime = beginTime.AddDays(1);
            if (i % 2 == 1)
            {
                beginTime = beginTime.AddMonths(1);
            }
        }
        defaultDbContext.AddRange(orders);
        defaultDbContext.SaveChanges();
    }
}
app.Run();

```
整个配置下来其实也就两个地方需要配置还是相对比较简单的,直接启动开始我们的测试模式

## 测试
### 默认配置下的测试
```c#

        public async Task<IActionResult> Test1()
        { Console.WriteLine("--------------Query Name Begin--------------");
            var order1 = await _defaultDbContext.Set<Order>().Where(o=>o.Name=="Order3").FirstOrDefaultAsync();
            Console.WriteLine("--------------Query Name End--------------");
            Console.WriteLine("--------------Query OrderNo Begin--------------");
            var order2 = await _defaultDbContext.Set<Order>().Where(o=>o.OrderNo== "202110080000000003").FirstOrDefaultAsync();
            Console.WriteLine("--------------Query OrderNo End--------------");
            Console.WriteLine("--------------Query OrderCreateTime Begin--------------");
            var dateTime = new DateTime(2021,10,08);
            var order4 = await _defaultDbContext.Set<Order>().Where(o=>o.CreateTime== dateTime).FirstOrDefaultAsync();
            Console.WriteLine("--------------Query OrderCreateTime End--------------");
            Console.WriteLine("--------------Query OrderNo Contains Begin--------------");
            var orderNos = new string[] { "202110080000000003", "202111090000000004" };
            var order5 = await _defaultDbContext.Set<Order>().Where(o=> orderNos.Contains(o.OrderNo)).ToListAsync();
            Console.WriteLine("--------------Query OrderNo Contains End--------------");

            Console.WriteLine("--------------Query OrderNo None Begin--------------");
            var time = new DateTime(2021,11,1);
            var order6 = await _defaultDbContext.Set<Order>().Where(o=> o.OrderNo== "202110080000000003"&&o.CreateTime> time).FirstOrDefaultAsync();
            Console.WriteLine("--------------Query OrderNo None End--------------");
            Console.WriteLine("--------------Query OrderNo Not Check Begin--------------");
            var order3 = await _defaultDbContext.Set<Order>().Where(o => o.OrderNo == "a02110080000000003").FirstOrDefaultAsync();
            Console.WriteLine("--------------Query OrderNo Not Check End--------------");

            return Ok();
        }
```
测试结果
![](https://img2020.cnblogs.com/blog/1346660/202112/1346660-20211225121113289-352519801.png)

测试结果非常完美除了无法匹配路由的时候那么我们该如何设置呢

### 测试无路由返回默认值
```c#
builder.Services.AddShardingDbContext<DefaultDbContext>(...)
    .Begin(o =>
    {
....
        o.ThrowIfQueryRouteNotMatch = false;//配置默认不抛出异常
    })
```
我们再次来看下测试结果
![](https://img2020.cnblogs.com/blog/1346660/202112/1346660-20211225121237003-804623427.png)

为何我们测试是不经过数据库直接查询,原因就是在我们做各个属性分片交集的时候返回了空那么框架会选择抛出异常或者返回默认值两种选项,并且我们在编写路由的时候判断格式不正确返回` return tail => false;`直接让所有的交集都是空所以不会进行一次无意义的数据库查询

## 总结
看到这边你应该已经看到了本框架的强大之处,本框架不但可以实现多字段分片还可以实现自定义分片,而不是单单按时间分片这么简单,我完全可以设置订单从2021年后的订单按月分片,2021年前的订单按年分片,对于sharding-core而言这简直轻而易举,但是据我所知.Net下目前除了我没有任何一款框架可以做到真正的全自动分片+多字段分片,所以我们在设计框架分片的时候尽可能的将有用的信息添加到一些无意义的字段上比如Id可以有效的解决很多在大数据下发生的问题,你可以简单理解为我加了一个索引并且附带了额外列,我加了一个id并且带了分表信息在里面,也可以完全设计出一款附带分库的属性到id里面使其可以支持分表分库
