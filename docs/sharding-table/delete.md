---
icon: stack
title: 删除
category: 使用指南
---

## Demo
本次分表的demo源码：[EFCoreShardingTable](https://github.com/xuejmnet/sharding-core/tree/main/samples/Sample.SqlServerShardingTable)

## 删除数据
增删改查除了查询稍微在分表+排序的情况下需要注意其实其他操作和efcore基本上一致

删除也是
```csharp
        public async Task<IActionResult> Delete()
        {
            var sysUser = await _myDbContext.Set<SysUser>().Where(o => o.Id == "9").FirstOrDefaultAsync();
            _myDbContext.Remove(sysUser);
            var i = await _myDbContext.SaveChangesAsync();
            return Ok(i);
        }
```
控制台我们可以看到对应的执行sql
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (12ms) [Parameters=[@p0='?' (Size = 50) (DbType = AnsiString)], CommandType='Text', CommandTimeout='30']
      SET NOCOUNT ON;
      DELETE FROM [SysUser]
      WHERE [Id] = @p0;
      SELECT @@ROWCOUNT;
```