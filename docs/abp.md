---
icon: launch
title: AbpVNext
category: AbpVNext集成
---


## Demo
[AbpVNextShardingTodoApp](https://github.com/xuejmnet/AbpVNextShardingTodoApp)

## Blog
[Integrate With AbpVNext Blog](https://www.cnblogs.com/xuejiaming/p/15449819.html)


## code first
首先abp这边使用`code first`相对比较简单,第一步我们将vs的程序启动项设置为控制台程序`Project.DbMigrator`并且在该项目下新建一个`IDesignTimeDbContextFactory<>`的实现类,并且将nuget控制台启动项设置为`Project.DbMigrator`,然后就可以进行愉快的code first了