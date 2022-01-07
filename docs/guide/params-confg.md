---
icon: customize
title: 参数配置
category: 使用指南
---

## EnableTableRouteCompileCache
针对分表下的表达式编译,默认null
针对单个结果的表达式进行编译缓存可以有效的提高性能

## EnableDataSourceRouteCompileCache
针对分库下的表达式编译,默认null
针对单个结果的表达式进行编译缓存可以有效的提高性能

## EnsureCreatedWithOutShardingTable

这个属性的意思很好理解就是是否需要在启动的时候创建表，这边的创建表是除了分表的对象，其他对象都会直接创建对应的表，只有当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

有库了不会建库，普通表(非分表的可以是分库的表但不能是分表的表)有任何一张存在库里了别的普通表都不会被创建

::: warning 注意
!!!**只有**当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表!!!

!!!**只有**当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表!!!

!!!**只有**当数据库是空的前提下或者没有数据库的前提下会自动创建数据库和普通表!!!
:::

## CreateShardingTableOnStart

这个属性的意思就是是否需要在启动的时候创建分表了的表，但是由于`efcore`并未提供关于表是否存在的判断，所以如果你将这个值设置为true,那么每次都会在启动的时候都会去执行创建表的方法，这样就会导致启动的时候如果有某些表过多那么就会导致启动速度变慢，可以再您未创建表的时候使用这个属性，创建完成后将这个属性设置为false，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## IgnoreCreateTableError

`sharding-core`默认会在创建表失败后输出错误信息,但是输出的信息会被log记录所以为了log不记录这些信息，可以将这个值设置为true那么如果创建失败(已经存在表)框架将不会抛出对应的错误消息，如果您是使用[code-first](/sharding-core-doc/adv/code-first/)的那么这个值可以无视或者设置为false。

## MaxQueryConnectionsLimit

最大并发链接数，就是表示单次查询`sharding-core`允许使用的dbconnection，默认会加上1就是说如果你配置了`MaxQueryConnectionsLimit=10`那么实际`sharding-core`会在同一次查询中开启11条链接最多,为什么是11不是10因为`sharding-core`会默认开启一个链接用来进行空dbconnection的使用。如果不设置本参数那么默认是cpu线程数`Environment.ProcessorCount`

## ConnectionMode
链接模式,可以由用户自行指定，使用内存限制,和连接数限制或者系统自行选择最优

链接模式，有三个可选项，分别是：
### MEMORY_STRICTLY
内存限制模式最小化内存聚合 流式聚合 同时会有多个链接

MEMORY_STRICTLY的意思是最小化内存使用率，就是非一次性获取所有数据然后采用流式聚合

### CONNECTION_STRICTLY
连接数限制模式最小化并发连接数 内存聚合 连接数会有限制

CONNECTION_STRICTLY的意思是最小化连接并发数，就是单次查询并发连接数为设置的连接数`MaxQueryConnectionsLimit`。因为有限制，所以无法一直挂起多个连接，数据的合并为内存聚合采用最小化内存方式进行优化，而不是无脑使用内存聚合


### SYSTEM_AUTO
系统自动选择内存还是流式聚合

系统自行选择会根据用户的配置采取最小化连接数，但是如果遇到分页则会根据分页策略采取内存限制，因为skip过大会导致内存爆炸


::: warning 注意
!!!如果用户手动设置ConnectionMode则按照用户设置的为准,之后判断本次查询skip是否大于UseMemoryLimitWhileSkip,如果是采用`MEMORY_STRICTLY`,之后才是系统动态设置根据`MaxQueryConnectionsLimit`来分配!!!
!!!如果用户手动设置ConnectionMode则按照用户设置的为准,之后判断本次查询skip是否大于UseMemoryLimitWhileSkip,如果是采用`MEMORY_STRICTLY`,之后才是系统动态设置根据`MaxQueryConnectionsLimit`来分配!!!
!!!如果用户手动设置ConnectionMode则按照用户设置的为准,之后判断本次查询skip是否大于UseMemoryLimitWhileSkip,如果是采用`MEMORY_STRICTLY`,之后才是系统动态设置根据`MaxQueryConnectionsLimit`来分配!!!
:::