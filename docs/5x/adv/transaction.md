---
icon: launch
title: 事务
category: 高级
---


## 开启事务

```csharp
//使用方式和原生efcore一致
var tran = _defaultTableDbContext.Database.BeginTransaction()
```

## 提交事务
```csharp
tran.Commit()
```
## 回滚事务
```csharp
tran.Rollback()
```

## 如何使用
```csharp

            using (var tran = _defaultTableDbContext.Database.BeginTransaction())
            {
                _defaultTableDbContext.Set<SysUserMod>().Insert(data);
                _defaultTableDbContext.SaveChanges();
                var a = 0;
                var b = 1 / a;//强制出错
                tran.Commit();
            }
```
使用方式和efcore一致，无需手动调用回滚，会在出错时自动回滚,如果是efcore普通操作需要调用`SaveChanges`，如果是三方框架直接提交的那么就不需要调用`SaveChanges`

## 加入外部事务
```csharp
_defaultTableDbContext.Database.UseTransaction(transaction)
```
使用方式和efcore一致


## 分库下的事务
分库情况下使用事务需要注意一点，默认启用的是弱事务，如果出现本次操作跨库那么具体的逻辑为开启默认数据源(data source name 为default的那个)事务，之后通知现有的`IDataSourceDbContext`分别开启事务,提交的时候采用弱一致性，先提交默认的data source name的数据源事务，如果出错并且外部只有一个数据源那么就抛错，如果默认数据源事务出错就直接出错，如果非默认事务提交出错且数据源存在多个将忽略错误依次提交，手动调用rollback如果是回滚那么就是依次回滚不在抛错。仅保证业务逻辑下出错完美事务，网络原因导致的事务提交出错程序无法处理