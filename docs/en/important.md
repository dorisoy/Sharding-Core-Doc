---
icon: launch
title: Important
category: Important
---
## GetHashCode
c# `GetHashCode` 

When we do not modify the object, we call hashcode many times to return the same integer. In the same application, if we execute it many times, the integer returned by each execution may be inconsistent 
suggestion use `sharding-core` provider method `ShardingCoreHelper.GetStringHashCode(shardingKeyStr)`

## Group By

if use `group by` queryable will append order by while order by item is empty,if has order by item shoule use full select properties

## GUID
c# guid compare is difference with sqlserver uniqueidentifier，`sharding-core` is fix this bug,use SqlGuid to compare,but not fix `Nullable<Guid>` if u want fix it. example:
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
**注意:fix c# compare guid**

## auto increment field
do not configure auto increment field in `sharding-core` sharding field。e.g:increment id

## EnsureCreated
`DbContext.Database.EnsureCreated()` if u want use this method ,plz impl `IMigrationsSqlGenerator`

## sharding with time
if u use sharding with time field,plz read[pagination](/en/adv/pagination)