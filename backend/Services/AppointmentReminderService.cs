using System.Globalization;
using backend.Models;

namespace backend.Services;

public class AppointmentReminderService : IAppointmentReminderService
{
    private readonly IEmailService _emailService;

    public AppointmentReminderService(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public Task SendAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default)
    {
        var patientName = appointment.Patient?.Name ?? "";
        var patientEmail = appointment.Patient?.Email ?? "";
        var doctorName = appointment.Doctor?.Name ?? "";

        if (string.IsNullOrWhiteSpace(patientEmail))
        {
            throw new InvalidOperationException(
                "This patient does not have an email address.");
        }

        var formattedDate = appointment.AppointmentDate.ToString(
            "d 'de' MMMM 'de' yyyy 'a las' h:mm tt",
            CultureInfo.GetCultureInfo("es-CR"));

        var body = $"""
            Hello {patientName},

            This is a reminder that you have an appointment with {doctorName} on {formattedDate}

            Regards,
            Clinic Team
            """;

        return _emailService.SendAsync(
            patientEmail,
            "Appointment Reminder",
            body,
            cancellationToken);
    }
}
