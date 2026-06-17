using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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
        var appointments = await _context.Appointments
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
        var appointments = await _context.Appointments
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
        var validationError = await ValidateAppointmentAsync(appointment);
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
        catch (Exception ex)
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

            var validationError = await ValidateAppointmentAsync(appointment, id);
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
        catch (Exception ex)
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

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    private async Task<string?> ValidateAppointmentAsync(Appointment appointment, int? appointmentId = null)
    {
        var dateError = ValidateAppointmentDate(appointment);
        if (dateError != null) return dateError;

        var doctorError = await ValidateDoctorExistsAsync(appointment.DoctorId);
        if (doctorError != null) return doctorError;

        var patientError = await ValidatePatientExistsAsync(appointment.PatientId);
        if (patientError != null) return patientError;

        var doctorAvailabilityError = await ValidateDoctorAvailabilityAsync(appointment, appointmentId);
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
        var doctorExists = await _context.Doctors.AnyAsync(d => d.Id == doctorId);

        if (!doctorExists)
        {
            return "Doctor does not exist.";
        }

        return null;
    }

    private async Task<string?> ValidatePatientExistsAsync(int patientId)
    {
        var patientExists = await _context.Patients.AnyAsync(p => p.Id == patientId);

        if (!patientExists)
        {
            return "Patient does not exist.";
        }

        return null;
    }

    private async Task<string?> ValidateDoctorAvailabilityAsync(Appointment appointment, int? appointmentId = null)
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
}