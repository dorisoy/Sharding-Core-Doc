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


|                                  Method |  N |         Mean |       Error |      StdDev |       Median |
|---------------------------------------- |--- |-------------:|------------:|------------:|-------------:|
|           NoShardingFirstOrDefaultAsync | 10 |     2.305 ms |   0.0419 ms |   0.0587 ms |     2.310 ms |
|             ShardingFirstOrDefaultAsync | 10 |     4.200 ms |   0.0793 ms |   0.0815 ms |     4.205 ms |
|    NoShardingNoIndexFirstOrDefaultAsync | 10 | 1,521.727 ms |  11.7909 ms |  11.0292 ms | 1,519.390 ms |
|      ShardingNoIndexFirstOrDefaultAsync | 10 | 1,841.243 ms |  36.1808 ms |  49.5247 ms | 1,826.228 ms |
|             NoShardingNoIndexCountAsync | 10 | 1,602.127 ms |  31.2448 ms |  26.0908 ms | 1,592.494 ms |
|               ShardingNoIndexCountAsync | 10 | 1,946.878 ms |  33.9453 ms |  31.7525 ms | 1,948.952 ms |
|  NoShardingNoIndexFirstOrDefaultAsync0w | 10 |   703.570 ms |  10.4157 ms |   9.2332 ms |   705.236 ms |
|    ShardingNoIndexFirstOrDefaultAsync0w | 10 |   857.718 ms |  16.4004 ms |  15.3409 ms |   858.675 ms |
| NoShardingNoIndexFirstOrDefaultAsync99w | 10 |   818.947 ms |  16.2501 ms |  24.8156 ms |   814.093 ms |
|   ShardingNoIndexFirstOrDefaultAsync99w | 10 |   957.405 ms |  15.8800 ms |  16.9915 ms |   953.739 ms |
|        NoShardingNoIndexLikeToListAsync | 10 | 7,247.554 ms | 140.2374 ms | 191.9586 ms | 7,292.292 ms |
|          ShardingNoIndexLikeToListAsync | 10 | 7,232.702 ms | 106.7630 ms |  99.8662 ms | 7,184.900 ms |
|            NoShardingNoIndexToListAsync | 10 |   815.207 ms |  14.6120 ms |  21.4181 ms |   804.195 ms |
|              ShardingNoIndexToListAsync | 10 |   948.056 ms |   7.3526 ms |   6.8776 ms |   944.511 ms |

#### mysql 5.7,data rows 7553790=755w innerdb_buffer_size=3G


// * Summary *

BenchmarkDotNet=v0.13.1, OS=Windows 10.0.18363.1500 (1909/November2019Update/19H2)
AMD Ryzen 9 3900X, 1 CPU, 24 logical and 12 physical cores
.NET SDK=6.0.100
  [Host]     : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT
  DefaultJob : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT


|                                  Method |  N |          Mean |       Error |      StdDev |        Median |
|---------------------------------------- |--- |--------------:|------------:|------------:|--------------:|
|           NoShardingFirstOrDefaultAsync | 10 |     10.092 ms |   1.6571 ms |   4.5082 ms |      8.677 ms |
|             ShardingFirstOrDefaultAsync | 10 |      9.082 ms |   0.1810 ms |   0.3445 ms |      9.096 ms |
|    NoShardingNoIndexFirstOrDefaultAsync | 10 |      6.586 ms |   0.0795 ms |   0.0705 ms |      6.565 ms |
|      ShardingNoIndexFirstOrDefaultAsync | 10 |     17.617 ms |   0.3345 ms |   0.3129 ms |     17.481 ms |
|             NoShardingNoIndexCountAsync | 10 |      6.498 ms |   0.1188 ms |   0.1415 ms |      6.454 ms |
|               ShardingNoIndexCountAsync | 10 |     17.791 ms |   0.2928 ms |   0.2739 ms |     17.805 ms |
|  NoShardingNoIndexFirstOrDefaultAsync0w | 10 |      3.239 ms |   0.0285 ms |   0.0267 ms |      3.231 ms |
|    ShardingNoIndexFirstOrDefaultAsync0w | 10 |      8.826 ms |   0.1719 ms |   0.1688 ms |      8.806 ms |
| NoShardingNoIndexFirstOrDefaultAsync99w | 10 |      3.260 ms |   0.0208 ms |   0.0194 ms |      3.257 ms |
|   ShardingNoIndexFirstOrDefaultAsync99w | 10 |      8.634 ms |   0.1062 ms |   0.0994 ms |      8.653 ms |
|        NoShardingNoIndexLikeToListAsync | 10 | 26,941.543 ms | 138.5988 ms | 129.6454 ms | 26,920.578 ms |
|          ShardingNoIndexLikeToListAsync | 10 |  5,840.364 ms | 112.0434 ms | 115.0604 ms |  5,797.137 ms |
|            NoShardingNoIndexToListAsync | 10 | 25,865.136 ms | 115.6391 ms | 102.5111 ms | 25,847.258 ms |
|              ShardingNoIndexToListAsync | 10 |  5,502.922 ms |  92.7201 ms |  86.7305 ms |  5,483.847 ms |

具体可以通过first前两次结果来计算得出结论单次查询的的损耗为0.3-0.4毫秒之间,通过数据聚合和数据路由的损耗单次在0.3ms-0.4ms,其中创建dbcontext为0.1毫秒目前没有好的优化方案,0.013毫秒左右是路由表达式解析和编译,复杂表达式可能更加耗时,剩下的0.28毫秒为数据源和表后缀的解析等操作包括实例的反射创建和数据的聚合，
sqlserver的各项数据在分表和未分表的情况下都几乎差不多可以得出在770w数据集情况下数据库还并未是数据瓶颈的关键，但是mysql可以看到在分表和未分表的情况下如果涉及到没有索引的全表扫描那么性能的差距将是分表后的表数目之多，测试中为5-6倍，也就是分表数目
