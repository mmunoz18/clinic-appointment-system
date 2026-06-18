using System.Security.Claims;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Doctor")]
public class DoctorDashboardController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public DoctorDashboardController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet("/api/doctor-dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var doctorId = await GetLoggedInDoctorIdAsync();
        if (!doctorId.HasValue)
        {
            return DoctorProfileNotLinked();
        }

        var now = DateTime.Now;
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        var appointments = _context.Appointments
            .AsNoTracking()
            .Where(a => a.DoctorId == doctorId.Value);

        var counts = new
        {
            MyPatients = await appointments.Select(a => a.PatientId).Distinct().CountAsync(),
            TodaysAppointments = await appointments.CountAsync(a =>
                a.AppointmentDate >= today && a.AppointmentDate < tomorrow),
            UpcomingAppointments = await appointments.CountAsync(a =>
                a.AppointmentDate > now && a.Status == "Scheduled"),
            CompletedAppointments = await appointments.CountAsync(a => a.Status == "Completed"),
            CancelledAppointments = await appointments.CountAsync(a => a.Status == "Cancelled")
        };

        var todaysAppointments = await AppointmentQuery(doctorId.Value)
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
            .OrderBy(a => a.AppointmentDate)
            .ToListAsync();

        var upcomingAppointments = await AppointmentQuery(doctorId.Value)
            .Where(a => a.AppointmentDate > now && a.Status == "Scheduled")
            .OrderBy(a => a.AppointmentDate)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            counts,
            todaysAppointments,
            upcomingAppointments
        });
    }

    [HttpGet("/api/doctor-patients")]
    public async Task<IActionResult> GetPatients()
    {
        var doctorId = await GetLoggedInDoctorIdAsync();
        if (!doctorId.HasValue)
        {
            return DoctorProfileNotLinked();
        }

        var patientQuery =
            from appointment in _context.Appointments.AsNoTracking()
            join patient in _context.Patients.AsNoTracking()
                on appointment.PatientId equals patient.Id
            where appointment.DoctorId == doctorId.Value
            group appointment by new
            {
                PatientId = patient.Id,
                patient.Name,
                patient.Email,
                patient.Cedula,
                patient.PhoneNumber
            }
            into patientAppointments
            select new
            {
                Id = patientAppointments.Key.PatientId,
                patientAppointments.Key.Name,
                patientAppointments.Key.Email,
                patientAppointments.Key.Cedula,
                patientAppointments.Key.PhoneNumber,
                AppointmentCount = patientAppointments.Count(),
                LastAppointmentDate = patientAppointments.Max(a => a.AppointmentDate)
            };

        var patients = await patientQuery
            .OrderBy(patient => patient.Name)
            .ToListAsync();

        return Ok(patients);
    }

    [HttpGet("/api/doctor-appointments")]
    public async Task<IActionResult> GetAppointments()
    {
        var doctorId = await GetLoggedInDoctorIdAsync();
        if (!doctorId.HasValue)
        {
            return DoctorProfileNotLinked();
        }

        var appointments = await AppointmentQuery(doctorId.Value)
            .OrderByDescending(a => a.AppointmentDate)
            .ToListAsync();

        return Ok(appointments);
    }

    private IQueryable<DoctorAppointmentResponse> AppointmentQuery(int doctorId)
    {
        return _context.Appointments
            .AsNoTracking()
            .Where(a => a.DoctorId == doctorId)
            .Select(a => new DoctorAppointmentResponse
            {
                Id = a.Id,
                DoctorId = a.DoctorId,
                DoctorName = a.Doctor != null ? a.Doctor.Name : "",
                PatientId = a.PatientId,
                PatientName = a.Patient != null ? a.Patient.Name : "",
                AppointmentDate = a.AppointmentDate,
                Status = a.Status
            });
    }

    private async Task<int?> GetLoggedInDoctorIdAsync()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

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

    private ObjectResult DoctorProfileNotLinked()
    {
        return StatusCode(
            StatusCodes.Status403Forbidden,
            "Your user account is not linked to a doctor profile. Contact an administrator.");
    }
}

public class DoctorAppointmentResponse
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
