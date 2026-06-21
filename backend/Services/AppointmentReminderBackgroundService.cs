using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

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
            }
            catch (Exception exception)
            {
                appointment.ReminderLastError = exception.Message;
                _logger.LogWarning(
                    exception,
                    "Failed to send {ReminderType} reminder for appointment {AppointmentId}.",
                    reminderType,
                    appointment.Id);
            }

            await context.SaveChangesAsync(cancellationToken);
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
}
