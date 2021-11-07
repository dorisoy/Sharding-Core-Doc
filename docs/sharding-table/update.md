---
icon: stack
title: 修改
category: 使用指南
---

## Demo
本次分表的demo源码：[EFCoreShardingTable](https://github.com/xuejmnet/sharding-core/tree/main/samples/Sample.SqlServerShardingTable)

## 自动追踪修改

```csharp
        public async Task<IActionResult> Update()
        {
            var sysUser = await _myDbContext.Set<SysUser>().Where(o => o.Id == "1").FirstOrDefaultAsync();
            sysUser.Name = "new name";
            var i=await _myDbContext.SaveChangesAsync();
            return Ok(i);
        }
```

```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (13ms) [Parameters=[@p1='?' (Size = 50) (DbType = AnsiString), @p0='?' (Size = 50) (DbType = AnsiString)], CommandType='Text', CommandTimeout='30']
      SET NOCOUNT ON;
      UPDATE [SysUser_01] SET [Name] = @p0
      WHERE [Id] = @p1;
      SELECT @@ROWCOUNT;
```
## 非自动追踪修改

```csharp
        public async Task<IActionResult> Update1()
        {
            var sysUser = await _myDbContext.Set<SysUser>().AsNoTracking().Where(o => o.Id == "1").FirstOrDefaultAsync();
            sysUser.Name = "new name";
            _myDbContext.Update(sysUser);
            var i = await _myDbContext.SaveChangesAsync();
            return Ok(i);
        }
````
```shell
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (12ms) [Parameters=[@p3='?' (Size = 50) (DbType = AnsiString), @p0='?' (Size = 50) (DbType = AnsiString), @p1='?' (Size = 50) (DbType = AnsiString), @p2='?' (Size = 50) (DbType = AnsiString)], CommandType='Text', CommandTimeout='30']
      SET NOCOUNT ON;
      UPDATE [SysUser_01] SET [Area] = @p0, [Name] = @p1, [SettingCode] = @p2
      WHERE [Id] = @p3;
      SELECT @@ROWCOUNT;
```
::: tip 结论
追踪情况下sharding-core依然可以对结果进行修改，修改的字段是被修改过后的字段

非追踪情况下sharding-croe也支持查询修改，但是修改的字段是全字段
:::