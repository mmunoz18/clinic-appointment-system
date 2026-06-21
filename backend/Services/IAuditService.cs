namespace backend.Services;

public interface IAuditService
{
    Task LogAsync(
        string entityType,
        int entityId,
        string action,
        string? details = null,
        string? entityName = null,
        int? userId = null,
        string? userName = null,
        CancellationToken cancellationToken = default);
}
