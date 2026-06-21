using System.Security.Claims;
using backend.Data;
using backend.Models;

namespace backend.Services;

public class AuditService : IAuditService
{
    private readonly ClinicDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditService> _logger;

    public AuditService(
        ClinicDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(
        string entityType,
        int entityId,
        string action,
        string? details = null,
        string? entityName = null,
        int? userId = null,
        string? userName = null,
        CancellationToken cancellationToken = default)
    {
        var principal = _httpContextAccessor.HttpContext?.User;

        if (!userId.HasValue)
        {
            var userIdValue = principal?.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (int.TryParse(userIdValue, out var parsedUserId))
            {
                userId = parsedUserId;
            }
        }

        userName ??= principal?.FindFirstValue(ClaimTypes.Name) ?? "System";

        var auditLog = new AuditLog
        {
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            Action = action,
            Details = details,
            UserId = userId,
            UserName = userName
        };

        try
        {
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            _context.Entry(auditLog).State =
                Microsoft.EntityFrameworkCore.EntityState.Detached;
            _logger.LogError(
                exception,
                "Failed to write audit log for {EntityType} #{EntityId}, action {Action}.",
                entityType,
                entityId,
                action);
        }
    }
}
