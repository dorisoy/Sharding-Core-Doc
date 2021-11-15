---
icon: launch
title: 分组查询
category: 查询
---

## 支持group
```csharp
    var ids = new[] {"200", "300"};
            var dateOfMonths = new[] {202111, 202110};
            var group = await (from u in _virtualDbContext.Set<SysUserSalary>()
                    .Where(o => ids.Contains(o.UserId) && dateOfMonths.Contains(o.DateOfMonth))
                group u by new
                {
                    UId = u.UserId
                }
                into g
                select new
                {
                    GroupUserId = g.Key.UId,
                    Count = g.Count(),
                    TotalSalary = g.Sum(o => o.Salary),
                    AvgSalary = g.Average(o => o.Salary),
                    AvgSalaryDecimal = g.Average(o => o.SalaryDecimal),
                    MinSalary = g.Min(o => o.Salary),
                    MaxSalary = g.Max(o => o.Salary)
                }).ToListAsync();
```

聚合函数 | 是否支持
--- | ---
Count | 支持
Sum | 支持
Max | 支持
Min | 支持
Average | 支持