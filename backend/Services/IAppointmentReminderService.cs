using backend.Models;

namespace backend.Services;

public interface IAppointmentReminderService
{
    Task SendAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default);
}
