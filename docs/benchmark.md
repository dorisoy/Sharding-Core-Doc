---
icon: launch
title: 性能测试
category: 性能测试
---

## 性能测试

以下所有数据均在开启了表达式编译缓存的情况下测试，并且电脑处于长时间未关机并且开着很多vs和idea的情况下仅供参考,所有测试都是基于ShardingCore x.3.1.63+ version

以下所有数据均在[源码中有案例](https://github.com/xuejmnet/sharding-core/blob/main/benchmarks/ShardingCoreBenchmark/EFCoreCrud.cs)

efcore版本均为6.0 表结构为string型id的订单取模分成5张表

N代表执行次数

#### sql server 2012,data rows 7734363 =773w

// * Summary *

BenchmarkDotNet=v0.13.1, OS=Windows 10.0.18363.1500 (1909/November2019Update/19H2)
AMD Ryzen 9 3900X, 1 CPU, 24 logical and 12 physical cores
.NET SDK=6.0.100
  [Host]     : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT
  DefaultJob : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT


|                               Method |  N |         Mean |       Error |      StdDev |       Median |
|------------------------------------- |--- |-------------:|------------:|------------:|-------------:|
|   NoShardingIndexFirstOrDefaultAsync | 10 |     2.154 ms |   0.1532 ms |   0.4443 ms |     1.978 ms |
|     ShardingIndexFirstOrDefaultAsync | 10 |     4.293 ms |   0.1521 ms |   0.4485 ms |     4.077 ms |
| NoShardingNoIndexFirstOrDefaultAsync | 10 |   823.382 ms |  16.0849 ms |  18.5233 ms |   821.221 ms |
|   ShardingNoIndexFirstOrDefaultAsync | 10 |   892.276 ms |  17.8131 ms |  16.6623 ms |   894.880 ms |
|          NoShardingNoIndexCountAsync | 10 |   830.754 ms |  16.5309 ms |  38.6405 ms |   821.736 ms |
|            ShardingNoIndexCountAsync | 10 |   915.630 ms |   8.8511 ms |   7.3911 ms |   914.107 ms |
|     NoShardingNoIndexLikeToListAsync | 10 | 7,008.918 ms | 139.4664 ms | 166.0248 ms | 6,955.674 ms |
|       ShardingNoIndexLikeToListAsync | 10 | 7,044.168 ms | 135.3814 ms | 132.9626 ms | 7,008.057 ms |
|         NoShardingNoIndexToListAsync | 10 |   787.129 ms |  10.5812 ms |   8.8357 ms |   785.798 ms |
|           ShardingNoIndexToListAsync | 10 |   935.880 ms |  16.3354 ms |  15.2801 ms |   940.369 ms |

#### mysql 5.7,data rows 7553790=755w innerdb_buffer_size=3G


// * Summary *

BenchmarkDotNet=v0.13.1, OS=Windows 10.0.18363.1500 (1909/November2019Update/19H2)
AMD Ryzen 9 3900X, 1 CPU, 24 logical and 12 physical cores
.NET SDK=6.0.100
  [Host]     : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT
  DefaultJob : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT


|                               Method |  N |          Mean |       Error |        StdDev |        Median |
|------------------------------------- |--- |--------------:|------------:|--------------:|--------------:|
|   NoShardingIndexFirstOrDefaultAsync | 10 |      5.020 ms |   0.1245 ms |     0.3672 ms |      4.855 ms |
|     ShardingIndexFirstOrDefaultAsync | 10 |      7.960 ms |   0.1585 ms |     0.2514 ms |      7.974 ms |
| NoShardingNoIndexFirstOrDefaultAsync | 10 | 11,336.083 ms | 623.8044 ms | 1,829.5103 ms | 11,185.590 ms |
|   ShardingNoIndexFirstOrDefaultAsync | 10 |  5,422.259 ms |  77.5386 ms |    72.5296 ms |  5,390.019 ms |
|          NoShardingNoIndexCountAsync | 10 | 14,229.819 ms |  82.8929 ms |    77.5381 ms | 14,219.773 ms |
|            ShardingNoIndexCountAsync | 10 |  3,085.268 ms |  55.5942 ms |    49.2828 ms |  3,087.704 ms |
|     NoShardingNoIndexLikeToListAsync | 10 | 27,046.390 ms |  71.2034 ms |    59.4580 ms | 27,052.316 ms |
|       ShardingNoIndexLikeToListAsync | 10 |  5,707.009 ms | 106.8713 ms |    99.9675 ms |  5,672.453 ms |
|         NoShardingNoIndexToListAsync | 10 | 26,001.850 ms |  89.2787 ms |    69.7030 ms | 25,998.407 ms |
|           ShardingNoIndexToListAsync | 10 |  5,490.659 ms |  71.8199 ms |    67.1804 ms |  5,477.891 ms |

具体可以通过first前两次结果来计算得出结论单次查询的的损耗为0.2-0.3毫秒之间,通过数据聚合和数据路由的损耗单次在0.3ms-0.4ms,其中创建dbcontext为0.1毫秒目前没有好的优化方案,0.013毫秒左右是路由表达式解析和编译,复杂表达式可能更加耗时,剩下的0.2毫秒为数据源和表后缀的解析等操作包括实例的反射创建和数据的聚合，
sqlserver的各项数据在分表和未分表的情况下都几乎差不多可以得出在770w数据集情况下数据库还并未是数据瓶颈的关键，但是mysql可以看到在分表和未分表的情况下如果涉及到没有索引的全表扫描那么性能的差距将是分表后的表数目之多，测试中为5-6倍，也就是分表数目


**如果你可以接受单次查询的损耗在0.2ms-0.3ms的那相信这款框架将会是efcore下非常完美的一款分表分库组件**
