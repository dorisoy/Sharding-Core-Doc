---
icon: launch
title: 手动路由
category: 路由
---

## 背景
分表字段不一定在where条件里，但是需要进行自定表的查询,典型场景： 租户,很多时候租户Id分表,会存在于请求头或者请求体中,来确保后续的所有查询都需要走对应的分表，再比如多语言,可能我们会对语言进行分表,但是只会在请求时指定语言而不会将语言加入查询条件,甚至语言这个字段都不存在数据库中。

## 如何实现
1. 对应后缀表启用`提示路由`
```csharp

    public class SysUserModVirtualTableRoute : AbstractSimpleShardingModKeyStringVirtualTableRoute<SysUserMod>
    {
        /// <summary>
        /// 开启提示路由
        /// </summary>
        protected override bool EnableHintRoute => true;
        /// <summary>
        /// 开启断言路由 如果不需要断言那么可以选择不开启提示路由[EnableHintRoute]必须开启
        /// </summary>
        protected override bool EnableAssertRoute => true;

        public SysUserModVirtualTableRoute() : base(2, 3)
        {
        }
    }
```
1. 依赖注入`IShardingRouteManager`，并且开启`CreateScope`,`TryCreateOrAddMustTail<SysUserMod>("00","01")`
```csharp

        private readonly DefaultShardingDbContext _defaultTableDbContext;
        private readonly IShardingRouteManager _shardingRouteManager;

        public ValuesController(DefaultShardingDbContext defaultTableDbContext, IShardingRouteManager shardingRouteManager)
        {
            _defaultTableDbContext = defaultTableDbContext;
            _shardingRouteManager = shardingRouteManager;
        }


            using (_shardingRouteManager.CreateScope())
            {
                _shardingRouteManager.Current.TryCreateOrAddMustTail<SysUserMod>("00","01");
                //_shardingRouteManager.Current.TryCreateOrAddHintTail<SysUserMod>("00", "01");
                //_shardingRouteManager.Current.TryCreateOrAddAssertTail<SysUserMod>();

                var mod00s = await _defaultTableDbContext.Set<SysUserMod>().Skip(10).Take(11).ToListAsync();
            }
```
所有在`CreateScope`内部的`SysUserMod`的查询都将只会走指定的表也就是["00","01"],可以针对`Middleware`,`ActionFilter`处进行使用来达到租户的模式

## 路由过滤器
假设我们对单次查询返回的路由不满意需要配置,比如如果单次查询大于10个结果那么我们只需要返回前5个,这个操作该如何实现呢，
1. 路由后置过滤器，通过路由的重写
```csharp

        protected override List<IPhysicTable> AfterPhysicTableFilter(List<IPhysicTable> allPhysicTables, List<IPhysicTable> filterPhysicTables)
        {
            if (filterPhysicTables.Count >= 10)
            {
                //throw new Exception ....
                return filterPhysicTables.Take(5).ToList();
            }

            return filterPhysicTables;
        }
```
通过这个后置过滤我们可以轻轻松松的完成对查询的控制,但是这个是全局的等于说写了那么所有的该对象的路由都要进行这种操作,所以下面就有了第二种方式`断言路由`
2. 断言路由,所谓的断言路由其实就是提示路由下的一种所以如果我们需要使用断言路由就要进行对`提示路由`的开启
```csharp

        /// <summary>
        /// 开启提示路由
        /// </summary>
        protected override bool EnableHintRoute => true;
        /// <summary>
        /// 开启断言路由 如果不需要断言那么可以选择不开启提示路由[EnableHintRoute]必须开启
        /// </summary>
        protected override bool EnableAssertRoute => true;
```
如何使用断言路由，首先我们需要创建一个对应的路由断言
```csharp

        public class TestRouteAssert:ITableRouteAssert<SysUserMod>
        {
            public void Assert(List<IPhysicTable> allPhysicTables, List<IPhysicTable> resultPhysicTables)
            {

                if (resultPhysicTables.Count >= 10)
                {
                    //throw new Exception ....
                    resultPhysicTables=resultPhysicTables.Take(5).ToList();
                }
            }
        }
```
```csharp

            using (_shardingRouteManager.CreateScope())
            {
                _shardingRouteManager.Current.TryCreateOrAddAssertTail<SysUserMod>(new TestRouteAssert());

                var mod00s = await _defaultTableDbContext.Set<SysUserMod>().Skip(10).Take(11).ToListAsync();
            }
```
这样我们就做到了和全局路由过滤器一样的效果但是是可以自定义的。

## MustTail
强制路由,使用强制路由`_shardingRouteManager.Current.TryCreateOrAddMustTail<SysUserMod>("00","01");`将无视断言路由和路由过滤器。
## HintTail
提示路由,使用方式和强制路由一样`_shardingRouteManager.Current.TryCreateOrAddHintTail<SysUserMod>("00", "01");`区别就是强制走提示路由后还需要在进行断言路由的判断

## AssertTail
断言路由用来进行断言判断和筛选查询过滤结果


::: warning 路由的顺序
1. 开启提示路由?开启判断有强制直接走强制，没强制就判断是否有提示有提示就走提示，走完提示在判断是否开启断言，开启了就再走断言，如果都没有就走普通
2. 开启了提示路由和断言路由，并且没有强制路由和提示路由，仅仅只有断言路由那么就是先走自动过滤筛选表，然后走全局过滤，最后走断言路由
:::

**注意具体的流程可以参考源码[AbstractShardingFilterVirtualTableRoute](https://github.com/xuejmnet/sharding-core/blob/main/src/ShardingCore/Core/VirtualRoutes/TableRoutes/Abstractions/AbstractShardingFilterVirtualTableRoute.cs) 或者[AbstractShardingFilterVirtualDataSourceRoute](https://github.com/xuejmnet/sharding-core/blob/main/src/ShardingCore/Core/VirtualRoutes/DataSourceRoutes/Abstractions/AbstractShardingFilterVirtualDataSourceRoute.cs)**