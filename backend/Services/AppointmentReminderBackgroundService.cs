using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace backend.Services;

public class AppointmentReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentReminderBackgroundService> _logger;

    public AppointmentReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<AppointmentReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRemindersAsync(stoppingToken);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "An unexpected error occurred while processing appointment reminders.");
            }

            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }

    private async Task ProcessRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ClinicDbContext>();
        var reminderService = scope.ServiceProvider
            .GetRequiredService<IAppointmentReminderService>();
        var auditService = scope.ServiceProvider
            .GetRequiredService<IAuditService>();

        var settings = await context.ReminderSettings
            .SingleOrDefaultAsync(
                reminderSettings => reminderSettings.Id == 1,
                cancellationToken);

        if (settings == null || !settings.Enabled)
        {
            return;
        }

        var checkStartedAt = DateTimeOffset.UtcNow;

        if (settings.NextCheckAt.HasValue &&
            settings.NextCheckAt.Value > checkStartedAt)
        {
            return;
        }

        settings.LastCheckAt = checkStartedAt;
        settings.NextCheckAt = checkStartedAt.AddHours(1);
        await context.SaveChangesAsync(cancellationToken);

        var now = DateTime.Now;
        var reminderWindowEnd = now.AddHours(24);
        var appointments = await context.Appointments
            .Include(appointment => appointment.Doctor)
            .Include(appointment => appointment.Patient)
            .Where(appointment =>
                appointment.Status == "Scheduled" &&
                appointment.AppointmentDate > now &&
                appointment.AppointmentDate <= reminderWindowEnd)
            .ToListAsync(cancellationToken);

        foreach (var appointment in appointments)
        {
            var timeUntilAppointment = appointment.AppointmentDate - now;
            var reminderType = GetReminderType(
                appointment,
                settings,
                timeUntilAppointment);

            if (reminderType == null)
            {
                continue;
            }

            appointment.ReminderLastAttemptAt = DateTimeOffset.UtcNow;

            try
            {
                await reminderService.SendAsync(appointment, cancellationToken);
                var sentAt = DateTimeOffset.UtcNow;

                if (reminderType == ReminderType.TwoHours)
                {
                    appointment.Reminder2HoursSentAt = sentAt;
                }
                else
                {
                    appointment.Reminder24HoursSentAt = sentAt;
                }

                appointment.ReminderLastError = null;
                settings.LastReminderSentAt = sentAt;
                await context.SaveChangesAsync(cancellationToken);
                await auditService.LogAsync(
                    "Appointment",
                    appointment.Id,
                    "ReminderSent",
                    $"Automatic {GetReminderLabel(reminderType.Value)} reminder sent to {appointment.Patient?.Name} for the appointment with {appointment.Doctor?.Name} on {FormatAppointmentDate(appointment.AppointmentDate)}.",
                    entityName: GetAppointmentEntityName(appointment),
                    userName: "System",
                    cancellationToken: cancellationToken);
            }
            catch (Exception exception)
            {
                appointment.ReminderLastError = exception.Message;
                await context.SaveChangesAsync(cancellationToken);
                await auditService.LogAsync(
                    "Appointment",
                    appointment.Id,
                    "ReminderFailed",
                    $"Automatic {GetReminderLabel(reminderType.Value)} reminder failed for {appointment.Patient?.Name}'s appointment with {appointment.Doctor?.Name} on {FormatAppointmentDate(appointment.AppointmentDate)}. {exception.Message}",
                    entityName: GetAppointmentEntityName(appointment),
                    userName: "System",
                    cancellationToken: cancellationToken);
                _logger.LogWarning(
                    exception,
                    "Failed to send {ReminderType} reminder for appointment {AppointmentId}.",
                    reminderType,
                    appointment.Id);
            }

        }
    }

    private static ReminderType? GetReminderType(
        Appointment appointment,
        ReminderSettings settings,
        TimeSpan timeUntilAppointment)
    {
        if (settings.Send2HoursBefore &&
            timeUntilAppointment <= TimeSpan.FromHours(2) &&
            appointment.Reminder2HoursSentAt == null)
        {
            return ReminderType.TwoHours;
        }

        if (settings.Send24HoursBefore &&
            timeUntilAppointment > TimeSpan.FromHours(2) &&
            appointment.Reminder24HoursSentAt == null)
        {
            return ReminderType.TwentyFourHours;
        }

        return null;
    }

    private enum ReminderType
    {
        TwentyFourHours,
        TwoHours
    }

    private static string GetReminderLabel(ReminderType reminderType)
    {
        return reminderType == ReminderType.TwoHours
            ? "2-hour"
            : "24-hour";
    }

    private static string GetAppointmentEntityName(
        Appointment appointment)
    {
        return $"{appointment.Patient?.Name ?? "Unknown patient"} with {appointment.Doctor?.Name ?? "Unknown doctor"}";
    }

    private static string FormatAppointmentDate(DateTime appointmentDate)
    {
        return appointmentDate.ToString(
            "dddd, MMMM d, yyyy 'at' h:mm tt",
            CultureInfo.GetCultureInfo("en-US"));
    }
}
