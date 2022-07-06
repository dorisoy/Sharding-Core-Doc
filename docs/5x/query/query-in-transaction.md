---
icon: launch
title: 事务中查询
category: 查询
---

## 事务中查询block

当我们开启事务的时候如果涉及到跨表查询,那么sharding-core的做法是这样的
1. 因为同一个connection不能有多个结果集并行获取(除非sqlserver开始MARS)(MultipleActive Result Set),所以sharding-core默认所有数据库都不支持MARS,这个前提下那么涉及跨表操作就需要开始多个链接来进行并行查询+内存串行聚合。所以如果开启了事务不是同一个链接session的前提下，另一个链接是无法读取到事务内的数据结果，如果出现全表扫描的情况下可能会出现死锁,所以在事务内部建议使用with(nolock)，具体做法
```csharp
```

**注意**最好的做法是尽可能的短事务,不要再事务开启后,数据增删改后未提交事务的情况下进行跨表查询，所以只要保证尽可能短的事务就可以了