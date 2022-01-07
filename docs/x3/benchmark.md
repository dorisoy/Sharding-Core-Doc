---
icon: launch
title: 性能测试
category: 性能测试
---

## 性能

以下所有数据均在开启了表达式编译缓存的情况下测试，并且电脑处于长时间未关机并且开着很多vs和idea的情况下仅供参考,所有测试都是基于ShardingCore x.3.1.63+ version

以下所有数据均在[源码中有案例](https://github.com/xuejmnet/sharding-core/blob/main/benchmarks/ShardingCoreBenchmark/EFCoreCrud.cs)

efcore版本均为6.0 表结构为string型id的订单取模分成5张表

N代表执行次数

### 性能损耗 sql server 2012,data rows 7734363 =773w

// * Summary *

BenchmarkDotNet=v0.13.1, OS=Windows 10.0.18363.1500 (1909/November2019Update/19H2)
AMD Ryzen 9 3900X, 1 CPU, 24 logical and 12 physical cores
.NET SDK=6.0.100
  [Host]     : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT
  DefaultJob : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT


|                             Method |  N |     Mean |     Error |    StdDev |
|----------------------------------- |--- |---------:|----------:|----------:|
| NoShardingIndexFirstOrDefaultAsync | 10 | 1.512 ms | 0.0071 ms | 0.0063 ms |
|   ShardingIndexFirstOrDefaultAsync | 10 | 1.567 ms | 0.0127 ms | 0.0113 ms |

针对未分片数据的查询性能,可以看出10次查询差距为0.05ms,单次查询损耗约为5微妙=0.005毫秒,损耗占比为3%,

结论：efcore 原生查询和sharding-core的查询在针对未分片对象查询上性能可达原先的97%具有极高的性能

### 性能测试


#### sql server 2012,data rows 7734363 =773w

// * Summary *

BenchmarkDotNet=v0.13.1, OS=Windows 10.0.18363.1500 (1909/November2019Update/19H2)
AMD Ryzen 9 3900X, 1 CPU, 24 logical and 12 physical cores
.NET SDK=6.0.100
  [Host]     : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT
  DefaultJob : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT


|                               Method |  N |         Mean |       Error |      StdDev |       Median |
|------------------------------------- |--- |-------------:|------------:|------------:|-------------:|
|   NoShardingIndexFirstOrDefaultAsync | 10 |     1.739 ms |   0.0340 ms |   0.0540 ms |     1.739 ms |
|     ShardingIndexFirstOrDefaultAsync | 10 |     2.373 ms |   0.0460 ms |   0.0452 ms |     2.379 ms |
| NoShardingNoIndexFirstOrDefaultAsync | 10 |   579.584 ms |  15.7983 ms |  46.5816 ms |   564.566 ms |
|   ShardingNoIndexFirstOrDefaultAsync | 10 |   628.567 ms |  12.5324 ms |  35.3478 ms |   615.352 ms |
|          NoShardingNoIndexCountAsync | 10 |   521.954 ms |   9.7644 ms |  18.5778 ms |   523.128 ms |
|            ShardingNoIndexCountAsync | 10 |   622.595 ms |  11.8567 ms |  10.5107 ms |   619.452 ms |
|     NoShardingNoIndexLikeToListAsync | 10 | 6,352.417 ms | 123.3931 ms | 115.4220 ms | 6,360.908 ms |
|       ShardingNoIndexLikeToListAsync | 10 | 6,260.610 ms | 122.6605 ms | 108.7353 ms | 6,236.577 ms |
|         NoShardingNoIndexToListAsync | 10 |   491.013 ms |   4.0199 ms |   3.5635 ms |   490.473 ms |
|           ShardingNoIndexToListAsync | 10 |   620.591 ms |   6.8447 ms |   5.7156 ms |   620.634 ms |


#### mysql 5.7,data rows 7553790=755w innerdb_buffer_size=3G



// * Summary *

BenchmarkDotNet=v0.13.1, OS=Windows 10.0.18363.1500 (1909/November2019Update/19H2)
AMD Ryzen 9 3900X, 1 CPU, 24 logical and 12 physical cores
.NET SDK=6.0.100
  [Host]     : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT
  DefaultJob : .NET 6.0.0 (6.0.21.52210), X64 RyuJIT


|                               Method |  N |          Mean |       Error |        StdDev |        Median |
|------------------------------------- |--- |--------------:|------------:|--------------:|--------------:|
|   NoShardingIndexFirstOrDefaultAsync | 10 |      4.911 ms |   0.0952 ms |     0.1133 ms |      4.923 ms |
|     ShardingIndexFirstOrDefaultAsync | 10 |      5.736 ms |   0.1139 ms |     0.3020 ms |      5.630 ms |
| NoShardingNoIndexFirstOrDefaultAsync | 10 | 11,630.109 ms | 774.0088 ms | 2,282.1824 ms | 11,585.457 ms |
|   ShardingNoIndexFirstOrDefaultAsync | 10 |  5,388.529 ms |  39.1442 ms |    36.6155 ms |  5,391.835 ms |
|          NoShardingNoIndexCountAsync | 10 | 14,245.844 ms |  74.1221 ms |    69.3339 ms | 14,242.815 ms |
|            ShardingNoIndexCountAsync | 10 |  3,007.845 ms |  24.6299 ms |    23.0388 ms |  3,007.830 ms |
|     NoShardingNoIndexLikeToListAsync | 10 | 27,026.048 ms | 145.6814 ms |   121.6505 ms | 27,032.112 ms |
|       ShardingNoIndexLikeToListAsync | 10 |  5,650.041 ms |  94.9405 ms |    88.8074 ms |  5,622.049 ms |
|         NoShardingNoIndexToListAsync | 10 | 26,068.783 ms | 103.7831 ms |    97.0788 ms | 26,094.834 ms |
|           ShardingNoIndexToListAsync | 10 |  5,414.644 ms |  71.2123 ms |    59.4655 ms |  5,395.306 ms |

具体可以通过first前两次结果来计算得出结论单次查询的的损耗为0.06-0.08毫秒之间， sqlserver的各项数据在分表和未分表的情况下都几乎差不多可以得出在770w数据集情况下数据库还并未是数据瓶颈的关键，但是mysql可以看到在分表和未分表的情况下如果涉及到没有索引的全表扫描那么性能的差距将是分表后的表数目之多，测试中为5-6倍，也就是分表数目


**如果你可以接受单次查询的损耗在0.06ms-0.08ms的那相信这款框架将会是efcore下非常完美的一款分表分库组件**
