using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/calendar")]
[Authorize(Policy = "AllRoles")]
public class CalendarController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public CalendarController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCalendarAppointments()
    {
        var query = _context.Appointments
            .AsNoTracking()
            .AsQueryable();

        if (User.IsInRole("Doctor"))
        {
            var doctorId = await GetLoggedInDoctorIdAsync();

            if (!doctorId.HasValue)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    "Your user account is not linked to a doctor profile. Contact an administrator.");
            }

            query = query.Where(appointment =>
                appointment.DoctorId == doctorId.Value);
        }

        var appointmentData = await query
            .OrderBy(appointment => appointment.AppointmentDate)
            .Select(appointment => new
            {
                appointment.Id,
                PatientName = appointment.Patient != null
                    ? appointment.Patient.Name
                    : "",
                DoctorName = appointment.Doctor != null
                    ? appointment.Doctor.Name
                    : "",
                DoctorSpecialty = appointment.Doctor != null
                    ? appointment.Doctor.Specialty
                    : "",
                appointment.AppointmentDate,
                appointment.Status,
                appointment.DoctorId,
                appointment.PatientId,
                appointment.ManualReminderSentAt,
                appointment.Reminder24HoursSentAt,
                appointment.Reminder2HoursSentAt,
                appointment.ReminderLastError
            })
            .ToListAsync();

        var appointments = appointmentData
            .Select(appointment => new CalendarAppointmentResponse
            {
                Id = appointment.Id,
                Title =
                    $"{appointment.PatientName} - {appointment.DoctorName}",
                Start = appointment.AppointmentDate,
                End = appointment.AppointmentDate.AddHours(1),
                Status = appointment.Status,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.DoctorName,
                DoctorSpecialty = appointment.DoctorSpecialty,
                PatientId = appointment.PatientId,
                PatientName = appointment.PatientName,
                ReminderStatus =
                    appointment.Status != "Scheduled" ||
                    appointment.AppointmentDate <= DateTime.Now
                        ? "NotApplicable"
                        : appointment.ReminderLastError != null
                            ? "Failed"
                            : appointment.ManualReminderSentAt != null ||
                              appointment.Reminder24HoursSentAt != null ||
                              appointment.Reminder2HoursSentAt != null
                                ? "Sent"
                                : "Pending"
            })
            .ToList();

        return Ok(appointments);
    }

    private async Task<int?> GetLoggedInDoctorIdAsync()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return null;
        }

        return await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.DoctorId)
            .SingleOrDefaultAsync();
    }
}
