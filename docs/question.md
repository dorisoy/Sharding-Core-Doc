---
icon: launch
title: 常见的问题
category: 常见的问题
---

### 使用外键报错
这边建议您在使用外键的时候如果是主表也是分表的情况下最好的情况就是取消外键

[移除外键的方法](https://github.com/xuejmnet/sharding-core/blob/main/samples/Sample.Migrations/RemoveForeignKeyMigrationsModelDiffer.cs)


### 没有自动建表
为什么我继承了默认的按时间分表,并且对`AutoCreateTableByTime`返回了true，但是还是没有建表呢？

- 首先确定是否是iis是否设置了休眠(默认就是休眠的20分钟)
- 然后查询数据库链接账号是否拥有权限建表
- 最后查询各个路由建表的时间节点对应的日志[默认路由创建节点](/sharding-core-doc/sharding-route/default-route/#abstractsimpleshardingweekkeydatetimevirtualtableroute)
- 如果没有可以选择开启DoLogError错误日志会输出详细错误

### 我不想在默认的时间点建表
- 修改对应的cron表达式返回`GetCronExpressions()`
- 并且重写`IncrementMinutes`值

原理:会在对应的cron表达式时间节点后添加`IncrementMinutes`分钟时间,然后算出对应的`tail`如果不重写`IncrementMinutes`会导致时间节点还是当前时间导致没办法创建表