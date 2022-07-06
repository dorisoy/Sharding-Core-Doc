---
icon: launch
title: 重要
category: 重要
---

## 前言
`ShardingCore`主旨是增加efcore，针对efcore的分片方面进行增强，并且不对efcore的业务代码进行侵入。不解决数据库层面的问题，编写复杂sql如果在sql层面是慢的那么`sharding-core`也是无能为力的.

## 版本
`ShardingCore`版本格式为a.b.c.d

- **a**表示`efcore`的版本号
- **b**表示`ShardingCore`主要版本号
- **c**表示`ShardingCore`小版本号
- **d**表示`ShardingCore`修订版本号

## 常见问题
因为当前架构师在当前dbcontext作为壳运行,crud会创建真实的dbcontext依托在当前dbcontext上,所以当前dbcontext目前crud都是可以的没有问题,但是如果遇到需要获取track或者其他的一些处理就不应该在当前dbcontext上处理,应该通过内部的DbContextExecutor来获取内部的DbContext来进行处理

## DbContext构造函数问题
请不要再DbContext构造函数内部调用会让model提前确定的方法比如
```c#
        public DefaultShardingDbContext(DbContextOptions<DefaultShardingDbContext> options) : base(options)
        {
            //切记不要在构造函数中使用会让模型提前创建的方法
            //ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
            //Database.SetCommandTimeout(30000);
        }
```

## 损耗
1.未分片对象查询,`ShardingCore`在针对未分片对象的查询上面进行了优化,单次的查询仅`0.005ms`损耗,性能为原生efcore的97%;
2.分片对象和原生efcore对象查询，在主键查询的情况下也就是只考虑`ShardingCore`损耗的情况下为单次`0.06ms`-`0.08ms`左右

当数据为瓶颈时分片后可以提高的性能是线性提升的,在数据库未成为读取数据库瓶颈时,整个查询两者差距不大

## 缺点
- 本库的缺点是比较消耗链接，针对`dbconnection`的消耗比一般的链接要高，但是可以通过启动时候配置`MaxQueryConnectionsLimit`字段来限制单次查询的`dbconnection`的消耗，从而可以让用户可以进行控制连接数.
- 目前不支持分表对象的`Include`,也不建议你对分表对象进行include,如果你需要操作分表对象请选择join方式而不是include
- 三方批处理对象需要获取真实`dbcontext`后才可以支持
- 因为不支持`Include`所以没必要给sharding对象进行导航属性设置(不支持导航属性)

## 为什么不用union或者union all
虽然union(all)在单表分表下面性能很好,但是再多表join下面生成的sql将是不可控的，性能和索引将是一个大大的问题因为涉及到分表的多表不一定索引一直因为可能会出现数据偏向问题建立不同的所以结构导致索引失效不好优化、并且不支持分库等一系列问题

### 查询为读写分离支持追踪
如果本次查询是读写分离无论走的什么链接都支持对应对象的追踪

## GetHashCode
c#的gethashcode并不能直接用来取模，因为c#的`GetHashCode`会在程序启动的生命周期内同一个字符串是一样的，但是如果程序关闭后在启动那么就会和之前的hashcode不一致,所以这边建议使用`sharding-core`提供的`ShardingCoreHelper.GetStringHashCode(shardingKeyStr)`

## Group By

如果使用group by那么为了保证程序正常执行会在group by下判断如果没有order字段会将所有的select属性加上去，如果有order by那么必须和group by的select字段一样数目,如果group by 对对应属性进行了`avg`操作那么请对该属性同样进行`count`操作

## GUID
如果您是sqlserver 并且在用guid排序那么为了和数据库guid排序一致请知悉,`sharding-core`默认会将guid转成sqlguid去比较来保证和数据库一致的排序表现,但是未提供`Nullable<Guid>`的排序正确判断,如果需要可自行实现,下面是一个案例
```csharp
/// <summary>
/// like this example
/// </summary>
/// <typeparam name="TShardingDbContext"></typeparam>
public class SqlServerNullableGuidCSharpLanguageShardingComparer<TShardingDbContext>:CSharpLanguageShardingComparer<TShardingDbContext> where TShardingDbContext : DbContext, IShardingDbContext
{
        public override int Compare(IComparable x, IComparable y, bool asc)
        {
            if (x is XXType xg && y is XXType yg)
            {
                return new XXFixedType(xg).SafeCompareToWith(new XXFixedType(yg), asc);
            }
            return base.Compare(x, y, asc);
        }
}

//configure
.ReplaceShardingComparer(sp=>new SqlServerNullableGuidCSharpLanguageShardingComparer<DefaultShardingDbContext>())
```
**注意:如果您使用的框架不是本框架,那么请确认他的分表聚合是否是内存聚合,如果是内存聚合请确保他会有正确的guid排序在数据库和内存之间**

## 自增Id
如果您在efcore配置了整型为自增那么请不要对自增字段设置为sharding字段因为会导致分表数据没办法正确分表，因为自增字段只有在正确插入到数据库后才会知道具体的值，所以不可以吧自增字段设置为分表/分库字段

## 性能优化
如果您对程序的性能有要求建议您针对每个路由开启表达式缓存，并且自行实现多表判断表达式缓存，系统默认会在你启用路由表达式缓存后针对单个表达式比较进行缓存提高10倍编译性能

```csharps

    public class SysUserSalaryVirtualTableRoute:AbstractShardingOperatorVirtualTableRoute<SysUserSalary,int>
    {
        //开启路由表达式缓存
        public override bool? EnableRouteParseCompileCache => true;

        //.....
    }
```


::: danger
！！！如果开启表达式缓存,请确认返回的表达式为固定值的比较比如tail，而不是每次都是不一样的表达式，不然会导致创建过多表达式从而导致性能问题具体参考[路由表达式缓存](/sharding-core-doc/adv/route-parse-compile-cache)。

！！！如果开启表达式缓存,请确认返回的表达式为固定值的比较比如tail，而不是每次都是不一样的表达式，不然会导致创建过多表达式从而导致性能问题具体参考[路由表达式缓存](/sharding-core-doc/adv/route-parse-compile-cache)。

！！！如果开启表达式缓存,请确认返回的表达式为固定值的比较比如tail，而不是每次都是不一样的表达式，不然会导致创建过多表达式从而导致性能问题具体参考[路由表达式缓存](/sharding-core-doc/adv/route-parse-compile-cache)。
:::

如果您需要使用一下方法需要注意
## EnsureCreated
`DbContext.Database.EnsureCreated()`如果您需要使用这个接口请自行实现`IMigrationsSqlGenerator`

## 时间分表
如果您是时间分表的那么请一定要阅读[高性能分页](/sharding-core-doc/adv/pagination)