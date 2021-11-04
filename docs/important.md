---
icon: launch
title: 重要
category: 重要
---

## 自增Id
如果您在efcore配置了整型为自增那么请不要对自增字段设置为sharding字段因为会导致分表数据没办法正确分表，因为自增字段只有在正确插入到数据库后才会知道具体的类型，所以不可以吧自增字段设置为分表/分库字段

如果您需要使用一下方法需要注意
## EnsureCreated
`DbContext.Database.EnsureCreated()`如果您需要使用这个接口请自行实现`IMigrationsSqlGenerator`