---
icon: launch
title: 重要
category: 重要
---
## GetHashCode
c#的gethashcode并不能直接用来取模，因为c#的gethashcode会在程序启动的生命周期内同一个字符串是一样的，但是如果程序关闭后在启动那么就会和之前的hashcode不一致,所以这边建议使用`sharding-core`提供的`ShardingCoreHelper.GetStringHashCode(shardingKeyStr)`

## Group By

如果使用group by那么为了保证程序正常执行会在group by下判断如果没有order字段会将所有的select属性加上去，如果有order by那么必须和group by的select字段一样数目

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
如果您在efcore配置了整型为自增那么请不要对自增字段设置为sharding字段因为会导致分表数据没办法正确分表，因为自增字段只有在正确插入到数据库后才会知道具体的类型，所以不可以吧自增字段设置为分表/分库字段

## 性能优化
如果您对程序的性能有要求建议您针对每个路由开启表达式缓存，并且自行实现多表判断表达式缓存，系统默认会在你启用路由表达式缓存后针对单个表达式比较进行缓存提高10倍编译性能

```csharps

    public class SysUserSalaryVirtualTableRoute:AbstractShardingOperatorVirtualTableRoute<SysUserSalary,int>
    {
        //开启路由表达式缓存
        public override bool EnableRouteParseCompileCache => true;

        //.....
    }
```


::: danger
！！！如果开启表达式缓存,请确认返回的表达式为固定值的比较比如tail，而不是每次都是不一样的表达式，不然会导致创建过多表达式从而导致性能问题具体参考[路由表达式缓存](/sharding-core-doc/adv/route-parse-compile-cache/)。

！！！如果开启表达式缓存,请确认返回的表达式为固定值的比较比如tail，而不是每次都是不一样的表达式，不然会导致创建过多表达式从而导致性能问题具体参考[路由表达式缓存](/sharding-core-doc/adv/route-parse-compile-cache/)。

！！！如果开启表达式缓存,请确认返回的表达式为固定值的比较比如tail，而不是每次都是不一样的表达式，不然会导致创建过多表达式从而导致性能问题具体参考[路由表达式缓存](/sharding-core-doc/adv/route-parse-compile-cache/)。
:::

如果您需要使用一下方法需要注意
## EnsureCreated
`DbContext.Database.EnsureCreated()`如果您需要使用这个接口请自行实现`IMigrationsSqlGenerator`

## 时间分表
如果您是时间分表的那么请一定要阅读[高性能分页](/sharding-core-doc/adv/pagination)