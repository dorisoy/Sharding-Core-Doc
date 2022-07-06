---
icon: launch
title: 高性能分页
category: 高级
---


::: warning 注意
!!!顺序分页如果对象支持分库会先判断分库如果分库不启用那么就不启用,如果仅分表会判断是否配置分表,优先级先分库配置再分表的配置,如果本次查询分库分表对象存在单库那么也支持!!!

!!!顺序分页如果对象支持分库会先判断分库如果分库不启用那么就不启用!!!

!!!顺序分页如果对象支持分库会先判断分库如果分库不启用那么就不启用!!!
:::


## 介绍
所谓的高性能分页是针对分表分库下的数据聚合来实现的一种分页，总所周知如果你是内存分页那么时间复杂度将是O(x*n)其中x表示：`子sql条数`,n表示需要跳过的条数，但是流式聚合的时间复杂度却是O(n)其中n表示需要跳过的条数。也就是说理论上流式聚合的性能要远高于内存聚合。

### 分表解决方案

 解决方案 | skip<=100  | skip<10000 | skip>10000   |优点|缺点
--- | --- | ---  | ---  | ---  | --- 
 **内存分表** | 速度快O(n)，n=skip*分表数| 速度快O(n)，n=skip*分表数,内存暴涨 | O(n)，n=skip*分表数,内存爆炸,速度越来越慢|实现简单,支持分库|skip过大内存暴涨
**union all** | 速度快 | 速度快 | 速度越来越慢|实现简单|不支持分库,不好优化,索引可能会失效
**流式分表** | 速度快O(n)，n=skip| 速度快O(n)，n=skip |O(n)，n=skip 速度越来越慢|支持分库|实现复杂,网络流量随着N增大


#### 1.内存分页
顾名思义就是将各个表的结果集合并到内存中进行排序后分页
#### 2.union all
使用的是数据库本身的聚合操作,用过匿名表来实现和操作当前表一样无感知
#### 3.流式分表
和名字一样就是通过next来一次一次获取,和datareader类似只有在next后才可以获取到客户端

## 高性能分页

### 介绍

目前sharding-core采用的是流式聚合所以普通情况下你的分页查询就是O(n)的性能代价，但是如果你是按时间来进行分表那么如果分页查询是以时间为主要排序就可以做到O(1)的分页性能。
### 条件
启用高性能分页有一个很重要的条件需要满足

假设分表对象是`a`,分表有`a1`、`a2`、`a3`....`an`满足 表名后缀1、2、3、4....n的排序顺序和`order by a.x`是同向的即可。

满足以下条件我们就可以说对象`a`的`x`属性满足高性能分页

正序:`min(a1.x)`<`max(a1.x)`<`min(a2.x)`<`max(a2.x)`......`min(an.x)`<`max(an.x)`
倒序:`min(a1.x)`>`max(a1.x)`>`min(a2.x)`>`max(a2.x)`......`min(an.x)`>`max(an.x)`

### 分页配置
很显然按时间分表无疑就是这种情况下的满足者，那么该如何开启呢

```csharp
    public class OrderPaginationConfiguration:IPaginationConfiguration<Order>
    {
        public void Configure(PaginationBuilder<Order> builder)
        {
            builder.PaginationSequence(o => o.CreateTime)
                .UseRouteComparer(Comparer<string>.Default)
                .UseQueryMatch(PaginationMatchEnum.Owner | PaginationMatchEnum.Named | PaginationMatchEnum.PrimaryMatch).UseAppendIfOrderNone();

            builder.ConfigReverseShardingPage(0.5d, 10000L);
        }
    }
```
我们是将订单表按订单的创建时间进行分页,所以可以得知订单分表后缀满足以上条件

`order_2019`,`order_20120`,`order_2021`满足`2019`<`2020`<`2021`且`min(order_2019.createTime)`<`max(order_2019.createTime)`<`min(order_2020.createTime)`<`max(order_2020.createTime)`<`min(order_2021.createTime)`<`max(order_2021.createTime)`

#### PaginationSequence
表示如果分页的时候按这个字段进行排序才会启用

如果你的id是雪花id那么也可以将id进行配置
```csharp
    public class OrderPaginationConfiguration:IPaginationConfiguration<Order>
    {
        public void Configure(PaginationBuilder<Order> builder)
        {
            builder.PaginationSequence(o => o.CreateTime)
                .UseRouteComparer(Comparer<string>.Default)
                .UseQueryMatch(PaginationMatchEnum.Owner | PaginationMatchEnum.Named | PaginationMatchEnum.PrimaryMatch).UseAppendIfOrderNone();
            //雪花id也满足以上表达式    
            builder.PaginationSequence(o => o.Id)
                .UseRouteComparer(Comparer<string>.Default)
                .UseQueryMatch(PaginationMatchEnum.Owner | PaginationMatchEnum.Named | PaginationMatchEnum.PrimaryMatch);

            builder.ConfigReverseShardingPage(0.5d, 10000L);
        }
    }
```

#### UseRouteComparer
表示后缀的排序顺序

#### UseQueryMatch
表示我们应该用何种方式来匹配本次查询,例子中的表名只要是CreateTime是属于本次返回结果的值或者名字匹配或者order by的第一个匹配即可

#### UseAppendIfOrderNone
表示如果本次查询没有任何order by字段的时候自动将`CreateTime`作为order by的条件附加上去，并且为正序当然一般情况下肯定是手动会加上order by所以不用太在意此属性

#### ConfigReverseShardingPage
表示启用反向排序，当分页total大于10000以上且本次查询skip的数目超过总的total的1/2那么就会启用反向排序

::: warning 注意
反向排序和顺序分页排序互斥优先级先进行顺序分页排序，当不符合顺序分页排序时才进行反向排序
:::

### 虚拟路由配置
```csharp
    public class OrderVirtualRoute:AbstractSimpleShardingDayKeyDateTimeVirtualTableRoute<Order>
    {

        public override DateTime GetBeginTime()
        {
            return DateTime.Now.Date.AddDays(-3);
        }
        
        /// <summary>
        /// 返回null表示不开启
        /// </summary>
        /// <returns></returns>
        public override IPaginationConfiguration<Order> CreatePaginationConfiguration()
        {
            return new OrderPaginationConfiguration();
        }
    }
```

###  如何使用
框架已经封装了一个分页的扩展
```csharp

        public static async Task<ShardingPagedResult<T>> ToShardingPageAsync<T>(this IQueryable<T> source, int pageIndex, int pageSize)
        {
            //设置每次获取多少页
            var take = pageSize <= 0 ? 1 : pageSize;
            //设置当前页码最小1
            var index = pageIndex <= 0 ? 1 : pageIndex;
            //需要跳过多少页
            var skip = (index - 1) * take;
            var shardingPageManager = ShardingContainer.GetService<IShardingPageManager>();
            using (shardingPageManager.CreateScope())
            {
                //获取每次总记录数
                var count = await source.LongCountAsync();
                if (count <= skip)
                    return new ShardingPagedResult<T>(new List<T>(0), count);
                //获取剩余条数
                var remainingCount = count - skip;
                //当剩余条数小于take数就取remainingCount
                var realTake = remainingCount < take ? remainingCount : take;
                var data = await source.Skip(skip).Take((int)realTake).ToListAsync();
                return new ShardingPagedResult<T>(data, count);
            }
        }
```
你可以自行封装或使用框架的
```csharp
            var shardingPageResult = await _defaultTableDbContext.Set<Order>().OrderBy(o => o.CreateTime).ToShardingPageAsync(pageIndex, pageSize);
```