using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Policy = "AdminOnly")]
public class AuditLogsController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public AuditLogsController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? entity = null,
        [FromQuery] string? action = null,
        [FromQuery] string? user = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(entity))
        {
            query = query.Where(log => log.EntityType == entity);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(log => log.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(user))
        {
            var normalizedUser = user.Trim().ToLower();
            query = query.Where(log =>
                log.UserName.ToLower().Contains(normalizedUser));
        }

        if (dateFrom.HasValue)
        {
            var from = DateTime.SpecifyKind(
                dateFrom.Value.Date,
                DateTimeKind.Utc);
            query = query.Where(log => log.CreatedAt >= from);
        }

        if (dateTo.HasValue)
        {
            var toExclusive = DateTime.SpecifyKind(
                dateTo.Value.Date.AddDays(1),
                DateTimeKind.Utc);
            query = query.Where(log => log.CreatedAt < toExclusive);
        }

        var totalCount = await query.CountAsync();
        var auditLogs = await query
            .OrderByDescending(log => log.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var items = auditLogs
            .Select(log => new AuditLogResponse
            {
                Id = log.Id,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                EntityName = log.EntityName,
                Action = log.Action,
                Details = log.Details,
                UserId = log.UserId,
                UserName = log.UserName,
                CreatedAt = new DateTimeOffset(
                    DateTime.SpecifyKind(
                        log.CreatedAt,
                        DateTimeKind.Utc))
            })
            .ToList();

        return Ok(new PagedResult<AuditLogResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }
}

public class AuditLogResponse
{
    public int Id { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public int EntityId { get; init; }
    public string? EntityName { get; init; }
    public string Action { get; init; } = string.Empty;
    public string? Details { get; init; }
    public int? UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
}
