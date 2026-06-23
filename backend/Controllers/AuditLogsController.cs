using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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
        var appointmentIds = auditLogs
            .Where(log => log.EntityType == "Appointment")
            .Select(log => log.EntityId)
            .Distinct()
            .ToList();
        var appointmentDetails = await _context.Appointments
            .AsNoTracking()
            .Where(appointment =>
                appointmentIds.Contains(appointment.Id))
            .Select(appointment => new AppointmentAuditSummary
            {
                Id = appointment.Id,
                PatientName = appointment.Patient != null
                    ? appointment.Patient.Name
                    : "Unknown patient",
                DoctorName = appointment.Doctor != null
                    ? appointment.Doctor.Name
                    : "Unknown doctor",
                AppointmentDate = appointment.AppointmentDate
            })
            .ToDictionaryAsync(appointment => appointment.Id);
        var items = auditLogs
            .Select(log =>
            {
                appointmentDetails.TryGetValue(
                    log.EntityId,
                    out var appointment);

                return new AuditLogResponse
                {
                    Id = log.Id,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    EntityName =
                        log.EntityType == "Appointment" &&
                        appointment != null
                            ? GetAppointmentEntityName(appointment)
                            : log.EntityName,
                    Action = log.Action,
                    Details =
                        log.EntityType == "Appointment" &&
                        appointment != null
                            ? GetAppointmentDetails(log.Action, appointment)
                            : log.EntityType == "Appointment" &&
                              string.IsNullOrWhiteSpace(log.EntityName)
                                ? GetGenericAppointmentDetails(log.Action)
                            : log.Details,
                    UserId = log.UserId,
                    UserName = log.UserName,
                    CreatedAt = new DateTimeOffset(
                        DateTime.SpecifyKind(
                            log.CreatedAt,
                            DateTimeKind.Utc))
                };
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

    private static string GetAppointmentEntityName(
        AppointmentAuditSummary appointment)
    {
        return $"{appointment.PatientName} with {appointment.DoctorName}";
    }

    private static string GetAppointmentDetails(
        string action,
        AppointmentAuditSummary appointment)
    {
        var date = appointment.AppointmentDate.ToString(
            "dddd, MMMM d, yyyy 'at' h:mm tt",
            CultureInfo.GetCultureInfo("en-US"));
        var subject =
            $"{appointment.PatientName} with {appointment.DoctorName}";

        return action switch
        {
            "Created" => $"Appointment created for {subject} on {date}.",
            "Updated" => $"Appointment updated for {subject} on {date}.",
            "Cancelled" => $"Appointment cancelled for {subject} on {date}.",
            "Completed" => $"Appointment completed for {subject} on {date}.",
            "ReminderSent" => $"Reminder sent to {appointment.PatientName} for the appointment with {appointment.DoctorName} on {date}.",
            "ReminderFailed" => $"Reminder failed for {appointment.PatientName}'s appointment with {appointment.DoctorName} on {date}.",
            _ => $"Appointment for {subject} on {date}."
        };
    }

    private static string GetGenericAppointmentDetails(string action)
    {
        return action switch
        {
            "Created" => "Appointment created.",
            "Updated" => "Appointment updated.",
            "Cancelled" => "Appointment cancelled.",
            "Completed" => "Appointment completed.",
            "Deleted" => "Appointment deleted.",
            "ReminderSent" => "Appointment reminder sent.",
            "ReminderFailed" => "Appointment reminder failed.",
            _ => "Appointment activity recorded."
        };
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

public class AppointmentAuditSummary
{
    public int Id { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string DoctorName { get; init; } = string.Empty;
    public DateTime AppointmentDate { get; init; }
}
