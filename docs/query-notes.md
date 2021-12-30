---
icon: launch
title: 查询注意事项
category: 查询注意事项
---

## 查询
### 未分片对象查询
如果本次查询对象不是分片(分表或者分库)的那么本次查询将交由原生efcore执行,而不是sharding-core接管,具体执行会在当前`DbContext`内部的`ShardingDbContextExecutor`属性内创建一个默认数据源名称的`DbContext`,这个`DbContext`内部模型对象映射到表上面都是原生表名称
```csharp
var order =await _myDbContext.Set<Order>().Where(o=>o.Id== 232398109278351360).FirstOrDefaultAsync();
```
`_myDbContext`在执行期间发现`Order`既不是分表也不是分库那么会将当前查询表达式通过创建一个空映射的DbContext来进行处理,所以如果你是原生的查询那么都将是支持的包括追踪
### 查询分片对象
如果本次查询仅有分片对象情况下,查询执行器将判断当前查询路由是否跨表是否跨库,如果不跨表并且不跨库如果满足这两点那么将进行一下判断

1.追踪查询
满足本次查询没有分表(**仅分库**)或者有分表的情况下所有的`tail`都一样并且所有的查询对象都需要是分表的，那么本次查询将交由efcore原生查询,生成的`DbContext`将分片对象映射到对应的分表对象上
2.非追踪查询
仅需满足不跨表和不跨库即可交由efcore原生查询

### 查询对象存在分片和为分片
将交由sharding-core查询聚合且返回对象如果是DbContext的model的对象类型那么将会进行手动track

### 未跟踪查询
如果你是未跟踪查询那么除了sharding对象的include不要使用,其他基本上无需考虑

::: warning
！！！如果查询对象是sharding对象那么请不要进行include操作,包括主表未分片子表分片。
！！！如果查询对象是sharding对象那么请不要进行include操作,包括主表未分片子表分片。
！！！如果查询对象是sharding对象那么请不要进行include操作,包括主表未分片子表分片。
:::

<img src="/sharding-core-doc/query-process.png">