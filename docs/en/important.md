---
icon: launch
title: Important
category: Important
---
## GetHashCode
c#的gethashcode并不能直接用来取模，因为c#的gethashcode会在程序启动的生命周期内同一个字符串是一样的，但是如果程序关闭后在启动那么就会和之前的hashcode不一致,所以这边建议使用`sharding-core`提供的`ShardingCoreHelper.GetStringHashCode(shardingKeyStr)`

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

如果您需要使用一下方法需要注意
## EnsureCreated
`DbContext.Database.EnsureCreated()`如果您需要使用这个接口请自行实现`IMigrationsSqlGenerator`

## 时间分表
如果您是时间分表的那么请一定要阅读[高性能分页](../adv/pagination)