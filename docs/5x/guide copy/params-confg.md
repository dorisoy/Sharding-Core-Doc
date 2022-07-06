---
icon: customize
title: 参数配置
category: 使用指南
---

## AutoTrackEntity
sharding-core默认针对分表后的数据将不支持追踪,未分表的对象支持原生efcore的追踪规则,如果你的查询对象A是部分表的那么依旧符合原生使用efcore的追踪规则,针对分表对象B那么将不再支持追踪.

### 使用追踪
你可以设置`AutoTrackEntity`为true
```csharp
services.AddShardingConfigure<MyDbContext>((conn, builder) =>
                {
                    builder.UseSqlServer(conn);
                }).Begin(o =>
                {
                })
```
那么所有的对象都将支持追踪。

### 不启用追踪
`AutoTrackEntity`设置为true或者false都没什么关系,建议设置为true，因为有可能需要使用追踪
```csharp
 services.AddShardingDbContext<DefaultShardingDbContext>(
                    (conn, o) =>
                        o.UseSqlServer(conn).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
                ).Begin(o =>
                {
                })
                .AddShardingTransaction((connection, builder) =>
                    builder.UseSqlServer(connection).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking))
```
追加所有的创建`DbContext`的委托`.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)`那么所有的查询都将不再启用追踪除非手动调用`AsTracking`

::: warning 注意
因为`AutoTrackEntity`设置为false后如果不设置`DbContext`为`.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)`那么分表后的查询依然会走追踪只是程序无法追踪到，因为查询的原理会新创建n个`DbContext`但是这些`DbContext`进行查询的时候并没有使用`NoTracking`所以性能上还是会有一定的损失，**总结就是`AutoTrackEntity`无脑设置为true**
:::

## EnsureCreatedWithOutShardingTable

这个属性的意思很好理解就是是否需要在启动的时候创建表，这边的创建表是除了分表的对象，其他对象都会直接创建对应的表，每次启动都会执行一下，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## CreateShardingTableOnStart

这个熟悉的意思就是是否需要在启动的时候创建表，但是由于`efcore`并未提供关于表是否存在的判断，所以如果你将这个值设置为true,那么每次都会在启动的时候都会去执行创建表的方法，这样就会导致启动的时候如果有某些表过多那么就会导致启动速度变慢，可以再您未创建表的时候使用这个属性，创建完成后将这个属性设置为false，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## IgnoreCreateTableError

`sharding-core`默认会在创建表失败后输出错误信息,但是输出的信息会被log记录所以为了log不记录这些信息，可以将这个值设置为true那么如果创建失败(已经存在表)框架将不会抛出对应的错误消息，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## ParallelQueryMaxThreadCount

并发查询最大线程数,默认cpu核心数*2，因为分表/分库后的单次查询会涉及到N张表，N>=1为了保证单次查询不会导致整个系统崩溃掉，所以这边提供了这个属性，可以保证涉及到跨库或者跨表的时候查询不会创建过多的`DbConnection`

## ParallelQueryTimeOut

并发查询超时时间,默认30秒,这个字段也是为了在分成多个线程查询后可能导致线程一致未返回结果，所以添加了这个字段在超时后可以取消掉现有的线程,防止无限制等待。