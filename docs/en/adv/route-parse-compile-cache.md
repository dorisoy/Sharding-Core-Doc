---
icon: launch
title: Route Parse Compile Cache
category: Adv
---

## 表达式缓存失效情况

### 可以复用表达式
```csharp

        public override Expression<Func<string, bool>> GetRouteToFilter(int shardingKey, ShardingOperatorEnum shardingOperator)
        {
            var t = TimeFormatToTail(shardingKey);
            switch (shardingOperator)
            {
                case ShardingOperatorEnum.GreaterThan:
                case ShardingOperatorEnum.GreaterThanOrEqual:
                    return tail => String.Compare(tail, t, StringComparison.Ordinal) >= 0;
                case ShardingOperatorEnum.LessThan:
                    return tail => String.Compare(tail, t, StringComparison.Ordinal) < 0;
                case ShardingOperatorEnum.LessThanOrEqual:
                    return tail => String.Compare(tail, t, StringComparison.Ordinal) <= 0;
                case ShardingOperatorEnum.Equal: return tail => tail == t;
                default:
                {
                    return tail => true;
                }
            }
        }
```

### 无法复用表达式
```csharp

        public override Expression<Func<string, bool>> GetRouteToFilter(int shardingKey, ShardingOperatorEnum shardingOperator)
        {
            var r = new Random().Next(1, 30000);
            var t = TimeFormatToTail(shardingKey);
            switch (shardingOperator)
            {
                case ShardingOperatorEnum.GreaterThan:
                case ShardingOperatorEnum.GreaterThanOrEqual:
                    return tail => String.Compare(tail, t, StringComparison.Ordinal) >= 0&&r==r;
                case ShardingOperatorEnum.LessThan:
                    return tail => String.Compare(tail, t, StringComparison.Ordinal) < 0 && r == r;
                case ShardingOperatorEnum.LessThanOrEqual:
                    return tail => String.Compare(tail, t, StringComparison.Ordinal) <= 0 ;
                case ShardingOperatorEnum.Equal: return tail => tail == t;
                default:
                {
                    return tail => true;
                }
            }
        }
```


复用表达式原理 为便利表达式各个几点针对各个节点的常量值成员变量值进行hashcode计算,因为下面的表达式`>`,`>=`出现了随机数所以每次结果将不一样,所以表达式将无法正确计算值。合理设计表达式返回并且利用表达式缓存可以有效提升程序性能,请勿出现上述情况下的表达式会导致表达式无法缓存并且堆积缓存区