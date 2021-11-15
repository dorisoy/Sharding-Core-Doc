---
icon: launch
title: 默认路由
category: 路由
---

## 默认路由
分库提供了默认的路由分表则需要自己去实现,具体实现可以参考分库

抽象abstract | 路由规则 | tail | 索引
--- |--- |--- |--- 
AbstractSimpleShardingModKeyIntVirtualTableRoute |取模 |0,1,2... | `=,contains`
AbstractSimpleShardingModKeyStringVirtualTableRoute |取模 |0,1,2... | `=,contains`
AbstractSimpleShardingDayKeyDateTimeVirtualTableRoute |按时间 |yyyyMMdd | `>,>=,<,<=,=,contains`
AbstractSimpleShardingDayKeyLongVirtualTableRoute |按时间戳 |yyyyMMdd | `>,>=,<,<=,=,contains`
AbstractSimpleShardingWeekKeyDateTimeVirtualTableRoute |按时间 |yyyyMMdd_dd | `>,>=,<,<=,=,contains`
AbstractSimpleShardingWeekKeyLongVirtualTableRoute |按时间戳 |yyyyMMdd_dd | `>,>=,<,<=,=,contains`
AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute |按时间 |yyyyMM | `>,>=,<,<=,=,contains`
AbstractSimpleShardingMonthKeyLongVirtualTableRoute |按时间戳 |yyyyMM | `>,>=,<,<=,=,contains`
AbstractSimpleShardingYearKeyDateTimeVirtualTableRoute |按时间 |yyyy | `>,>=,<,<=,=,contains`
AbstractSimpleShardingYearKeyLongVirtualTableRoute |按时间戳 |yyyy | `>,>=,<,<=,=,contains`

注:`contains`表示为`o=>ids.contains(o.shardingkey)`
注:使用默认的按时间分表的路由规则会让你重写一个GetBeginTime的方法这个方法必须使用静态值如:new DateTime(2021,1,1)不可以用动态值比如DateTime.Now因为每次重新启动都会调用该方法动态情况下会导致每次都不一致

## 索引
所谓的索引就是支持的表达式比如支持分表字段等于某个值，那么框架就会针对这个值进行解析出对应的数据库分表应该是哪个,并且支持组合`and`、`or`。
默认提供的分表路由里面已经实现了所谓的路由，如果你的查询是包含对应的路由那么框架可以大大减小数据库链接的开启。有助于程序的高性能。

假设我们是按id取模，那么如果你有指定的id对应值进行查询，我们就可以直接进行对分表/分库下进行数据源和表的定位，保证查询的高效。


### AbstractSimpleShardingModKeyIntVirtualTableRoute
该路由为简单的取模hash路由,分表字段是`int`类型,接受3个参数，第一个参数表示后缀的位数,第二位表示取模的基数，第三位是取模后缀不足的左补字符.

AbstractSimpleShardingModKeyStringVirtualTableRoute(3,6,'0')那么就是`000`、`001`、`002`、`003`、`004`、`005`

### AbstractSimpleShardingModKeyStringVirtualTableRoute
该路由为简单的取模hash路由,分表字段是`string`类型,接受3个参数，第一个参数表示后缀的位数,第二位表示取模的基数，第三位是取模后缀不足的左补字符.

AbstractSimpleShardingModKeyStringVirtualTableRoute(3,6,'0')那么就是`000`、`001`、`002`、`003`、`004`、`005`


### AbstractSimpleShardingDayKeyDateTimeVirtualTableRoute
该路由为简单的按天分表路由,支持分表字段是`DateTime`,分表后的后缀为`yyyyMMdd`.

### AbstractSimpleShardingDayKeyLongVirtualTableRoute
该路由为简单的按天分表路由,支持分表字段是`long`,分表后的后缀为`yyyyMMdd`.
```csharp

        public override DateTime GetBeginTime()
        {
            //注意必须返回固定时间,不然每次启动时间都会变动
            return new DateTime(2021, 1, 1);
        }
        //启动自动建表
        public override bool StartJob()
        {
            return true;
        }
```

注意按天分表的路由自动建表的执行顺序为:
1. 每天的23:59:00分,"0 59 23 * * ?"
2. 每天的00:00:00分,"0 0 0 * * ?"
3. 每天的00:01:00分,"0 1 0 * * ?"

分别会在这三个时间节点进行表的创建和数据表的动态添加,通过时间往后拨5分钟来创建对应的表tail

### AbstractSimpleShardingWeekKeyDateTimeVirtualTableRoute
该路由为简单的按周分表路由,支持分表字段是`DateTime`,分表后的后缀为`yyyyMMdd_dd`.

### AbstractSimpleShardingWeekKeyLongVirtualTableRoute
该路由为简单的按周分表路由,支持分表字段是`long`,分表后的后缀为`yyyyMMdd_dd`.
```csharp

        public override DateTime GetBeginTime()
        {
            //注意必须返回固定时间,不然每次启动时间都会变动
            return new DateTime(2021, 1, 1);
        }
        //启动自动建表
        public override bool StartJob()
        {
            return true;
        }
```

注意按周分表的路由自动建表的执行顺序为:
1. 每次周末的23:59:00分,"0 59 23 ? * 1"
2. 每次周一的00:00:00分,"0 0 0 ? * 2"
3. 每次周一的00:01:00分,"0 1 0 ? * 2"

分别会在这三个时间节点进行表的创建和数据表的动态添加,通过时间往后拨5分钟来创建对应的表tail

### AbstractSimpleShardingMonthKeyDateTimeVirtualTableRoute
该路由为简单的按月分表路由,支持分表字段是`DateTime`,分表后的后缀为`yyyyMM`.
### AbstractSimpleShardingMonthKeyLongVirtualTableRoute
该路由为简单的按月分表路由,支持分表字段是`long`,分表后的后缀为`yyyyMM`.
```csharp

        public override DateTime GetBeginTime()
        {
            //注意必须返回固定时间,不然每次启动时间都会变动
            return new DateTime(2021, 1, 1);
        }
        //启动自动建表
        public override bool StartJob()
        {
            return true;
        }
```


注意按月分表的路由自动建表的执行顺序为:
1. 每月的28、29、30、31日的23:59:00分,"0 59 23 28,29,30,31 * ?"
2. 每月的1日的00:00:00分,"0 0 0 1 * ?"
3. 每月的1日的00:01:00分,"0 1 0 1 * ?"

分别会在这三个时间节点进行表的创建和数据表的动态添加,通过时间往后拨5分钟来创建对应的表tail

### AbstractSimpleShardingYearKeyDateTimeVirtualTableRoute
该路由为简单的按年分表路由,支持分表字段是`DateTime`,分表后的后缀为`yyyy`.
### AbstractSimpleShardingYearKeyLongVirtualTableRoute
该路由为简单的按年分表路由,支持分表字段是`long`,分表后的后缀为`yyyy`.
```csharp

        public override DateTime GetBeginTime()
        {
            //注意必须返回固定时间,不然每次启动时间都会变动
            return new DateTime(2021, 1, 1);
        }
        //启动自动建表
        public override bool StartJob()
        {
            return true;
        }
```

注意按年分表的路由自动建表的执行顺序为:
1. 每年的31日的23:59:00分,"0 59 23 31 12 ?"
2. 每年的1日的00:00:00分,"0 0 0 1 1 ?"
3. 每年的1日的00:01:00分,"0 1 0 1 1 ?"

分别会在这三个时间节点进行表的创建和数据表的动态添加,通过时间往后拨5分钟来创建对应的表tail

**注意：所有的定时任务都可以设置为false,并且可以使用自身的定时任务来实现动态的创建表和添加表后缀**

## 时间分表的定时信息

为了保证可以让程序卡点发布还能正确创建对应的表信息和知道现有的表,所以存在三个节点进行创建表。
但是可能会出现重复创建表的信息，也会出现表没创建的其他原因导致程序执行失败，所以这边对其进行了日志的过滤用户可以再使用默认的时间分表的情况下选择重写`ShowErrorLog`属性来输出任务执行时候的建表异常信息。