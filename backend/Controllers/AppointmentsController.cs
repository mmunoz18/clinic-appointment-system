using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public AppointmentsController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Policy = "AllRoles")]
    public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
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

            query = query.Where(a => a.DoctorId == doctorId.Value);
        }

        var appointments = await query
        .Include(a => a.Doctor)
        .Include(a => a.Patient)
        .Select(a => new
        {
            a.Id,
            a.DoctorId,
            DoctorName = a.Doctor != null ? a.Doctor.Name : "",
            a.PatientId,
            PatientName = a.Patient != null ? a.Patient.Name : "",
            a.AppointmentDate,
            a.Status
        })
        .ToListAsync();

        return Ok(appointments);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "AllRoles")]
    public async Task<ActionResult<Appointment>> GetAppointment(int id)
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

            query = query.Where(a => a.DoctorId == doctorId.Value);
        }

        var appointments = await query
        .Include(a => a.Doctor)
        .Include(a => a.Patient)
        .Select(a => new
        {
            a.Id,
            a.DoctorId,
            DoctorName = a.Doctor != null ? a.Doctor.Name : "",
            a.PatientId,
            PatientName = a.Patient != null ? a.Patient.Name : "",
            a.AppointmentDate,
            a.Status
        })
        .FirstOrDefaultAsync(a => a.Id == id);
        
        if (appointments == null)
        {
            return NotFound();
        }

        return Ok(appointments);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOrReceptionist")]
    public async Task<ActionResult<Appointment>> CreateAppointment(Appointment appointment)
    {
        try
        {
        appointment.Status = "Scheduled";

        var validationError = await ValidateAppointmentAsync(appointment, validateFutureDate: true);
        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAppointment),
            new { id = appointment.Id },
            appointment
        );
        }
        catch
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AllRoles")]
    public async Task<IActionResult> UpdateAppointment(int id, Appointment appointment)
    {
        try
        {
            if (id != appointment.Id)
            {
                return BadRequest();
            }

            var existingAppointment = await _context.Appointments.FindAsync(id);

            if (existingAppointment == null)
            {
                return NotFound();
            }

            if (existingAppointment.Status == "Completed")
            {
                return BadRequest("Completed appointments cannot be edited.");
            }

            var appointmentDetailsChanged =
                appointment.DoctorId != existingAppointment.DoctorId ||
                appointment.PatientId != existingAppointment.PatientId ||
                appointment.AppointmentDate != existingAppointment.AppointmentDate;

            if (existingAppointment.AppointmentDate < DateTime.Now &&
                appointmentDetailsChanged)
            {
                return BadRequest("Past appointment details cannot be changed.");
            }

            if (User.IsInRole("Doctor"))
            {
                var doctorId = await GetLoggedInDoctorIdAsync();
                if (!doctorId.HasValue || existingAppointment.DoctorId != doctorId.Value)
                {
                    return Forbid();
                }

                if (appointmentDetailsChanged)
                {
                    return BadRequest("Doctors can only update the status of their own appointments.");
                }
            }

            var canEditError = ValidateAppointmentCanBeEdited(existingAppointment, appointment);
            if (canEditError != null)
            {
                return BadRequest(canEditError);
            }

            if (appointmentDetailsChanged)
            {
                var dateEditError = ValidateUpdatedAppointmentDate(appointment);
                if (dateEditError != null)
                {
                    return BadRequest(dateEditError);
                }
            }

            var validationError = await ValidateAppointmentAsync(
                appointment,
                id,
                validateFutureDate: false,
                validateSchedulingDetails: appointmentDetailsChanged);

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            existingAppointment.DoctorId = appointment.DoctorId;
            existingAppointment.PatientId = appointment.PatientId;
            existingAppointment.AppointmentDate = appointment.AppointmentDate;
            existingAppointment.Status = appointment.Status;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOrReceptionist")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        try
        {
            var appointment = await _context.Appointments.FindAsync(id);

            if (appointment == null)
            {
                return NotFound();
            }

            if (appointment.Status == "Completed")
            {
                return BadRequest("Completed appointments cannot be deleted.");
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    private async Task<string?> ValidateAppointmentAsync(
        Appointment appointment,
        int? appointmentId = null,
        bool validateFutureDate = true,
        bool validateSchedulingDetails = true)
    {
        var requiredFieldsError = ValidateAppointmentDetails(appointment);
        if (requiredFieldsError != null) return requiredFieldsError;

        var statusError = ValidateAppointmentStatus(appointment);
        if (statusError != null) return statusError;
        
        if (validateFutureDate)
        {
            var dateError = ValidateAppointmentDate(appointment);
            if (dateError != null) return dateError;
        }

        if (!validateSchedulingDetails)
        {
            return null;
        }

        var doctorError = await ValidateDoctorExistsAsync(appointment.DoctorId);
        if (doctorError != null) return doctorError;

        var patientError = await ValidatePatientExistsAsync(appointment.PatientId);
        if (patientError != null) return patientError;

        var scheduleError = await ValidateAppointmentWithinDoctorAvailabilityAsync(appointment);
        if (scheduleError != null) return scheduleError;

        var doctorAvailabilityError = await ValidateDoctorAppointmentConflictAsync(appointment, appointmentId);
        if (doctorAvailabilityError != null) return doctorAvailabilityError;

        var patientAvailabilityError = await ValidatePatientAvailabilityAsync(appointment, appointmentId);
        if (patientAvailabilityError != null) return patientAvailabilityError;

        return null;
    }

    private string? ValidateAppointmentDate(Appointment appointment)
    {
        if (appointment.AppointmentDate <= DateTime.Now)
        {
            return "Appointments must be scheduled in the future.";
        }

        return null;
    }

    private async Task<string?> ValidateDoctorExistsAsync(int doctorId)
    {
        var doctorExists = await _context.Doctors.AnyAsync(d =>
            d.Id == doctorId && d.IsActive);

        if (!doctorExists)
        {
            return "Doctor does not exist or is inactive.";
        }

        return null;
    }

    private async Task<string?> ValidatePatientExistsAsync(int patientId)
    {
        var patientExists = await _context.Patients.AnyAsync(p =>
            p.Id == patientId && p.IsActive);

        if (!patientExists)
        {
            return "Patient does not exist or is inactive.";
        }

        return null;
    }

    private async Task<string?> ValidateAppointmentWithinDoctorAvailabilityAsync(
        Appointment appointment)
    {
        var appointmentTime = TimeOnly.FromDateTime(appointment.AppointmentDate);
        var appointmentDay = appointment.AppointmentDate.DayOfWeek;

        var isWithinAvailability = await _context.DoctorAvailabilities.AnyAsync(
            availability =>
                availability.DoctorId == appointment.DoctorId &&
                availability.IsActive &&
                availability.DayOfWeek == appointmentDay &&
                appointmentTime >= availability.StartTime &&
                appointmentTime < availability.EndTime);

        if (!isWithinAvailability)
        {
            return "Doctor is not available at this date and time.";
        }

        return null;
    }

    private async Task<string?> ValidateDoctorAppointmentConflictAsync(
        Appointment appointment,
        int? appointmentId = null)
    {
        var hasConflict = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == appointment.DoctorId &&
            a.AppointmentDate == appointment.AppointmentDate &&
            (!appointmentId.HasValue || a.Id != appointmentId.Value));

        if (hasConflict)
        {
            return "Doctor already has an appointment at this time.";
        }

        return null;
    }

    private async Task<string?> ValidatePatientAvailabilityAsync(Appointment appointment, int? appointmentId = null)
    {
        var hasConflict = await _context.Appointments.AnyAsync(a => 
            a.PatientId == appointment.PatientId && 
            a.AppointmentDate == appointment.AppointmentDate &&
            (!appointmentId.HasValue || a.Id != appointmentId.Value));

        if (hasConflict)
        {
            return "Patient already has an appointment at this time.";
        }

        return null;
    }

    private string? ValidateAppointmentStatus(Appointment appointment)
    {
        var validStatuses = new[] { "Scheduled", "Completed", "Cancelled" };

        if (!validStatuses.Contains(appointment.Status))
        {
            return "Invalid appointment status.";
        }

        return null;
    }

    private string? ValidateAppointmentDetails(Appointment appointment)
    {
        if (appointment.AppointmentDate == default)
        {
            return "Appointment date is required.";
        }

        if (string.IsNullOrWhiteSpace(appointment.Status))
        {
            return "Appointment status is required.";
        }

        if (appointment.DoctorId == 0)
        {
            return "Doctor is required.";
        }

        if (appointment.PatientId == 0)
        {
            return "Patient is required.";
        }

        return null;
    }

    private string? ValidateAppointmentCanBeEdited(Appointment existingAppointment, Appointment updatedAppointment)
    {
        if (existingAppointment.Status == "Completed")
        {
            return "Completed appointments cannot be edited.";
        }

        if (existingAppointment.AppointmentDate < DateTime.Now &&
            updatedAppointment.Status == "Scheduled")
        {
            return "Past appointments cannot remain scheduled. Mark them as completed or cancelled.";
        }

        return null;
    }

    private string? ValidateUpdatedAppointmentDate(Appointment appointment)
    {
        if (appointment.AppointmentDate <= DateTime.Now)
        {
            return "Appointment date must remain in the future when editing appointment details.";
        }

        return null;
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
}
