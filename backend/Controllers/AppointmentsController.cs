using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public AppointmentsController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
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
    public async Task<ActionResult<Appointment>> CreateAppointment(Appointment appointment)
    {
        if (appointment.AppointmentDate <= DateTime.Now)
        {
            return BadRequest("Appointments must be scheduled in the future.");
        }

        var doctorExists = await _context.Doctors.AnyAsync(d =>
            d.Id == appointment.DoctorId);

        if (!doctorExists)
        {
            return BadRequest("Doctor does not exist.");
        }

        var patientExists = await _context.Patients.AnyAsync(p =>
            p.Id == appointment.PatientId);

        if (!patientExists)
        {
            return BadRequest("Patient does not exist.");
        }

        var doctorHasAppointment = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == appointment.DoctorId &&
            a.AppointmentDate == appointment.AppointmentDate);

        if (doctorHasAppointment)
        {
            return BadRequest("Doctor already has an appointment at this time.");
        }

        var patientHasAppointment = await _context.Appointments.AnyAsync(a =>
            a.PatientId == appointment.PatientId &&
            a.AppointmentDate == appointment.AppointmentDate);

        if (patientHasAppointment)
        {
            return BadRequest("Patient already has an appointment at this time.");
        }

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAppointment),
            new { id = appointment.Id },
            appointment
        );
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(int id, Appointment appointment)
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

        if (appointment.AppointmentDate <= DateTime.Now)
        {
            return BadRequest("Appointments must be scheduled in the future.");
        }

        var doctorExists = await _context.Doctors.AnyAsync(d =>
            d.Id == appointment.DoctorId);

        if (!doctorExists)
        {
            return BadRequest("Doctor does not exist.");
        }

        var patientExists = await _context.Patients.AnyAsync(p =>
            p.Id == appointment.PatientId);

        if (!patientExists)
        {
            return BadRequest("Patient does not exist.");
        }

        var doctorHasAppointment = await _context.Appointments.AnyAsync(a => 
            a.Id != id && 
            a.DoctorId == appointment.DoctorId && 
            a.AppointmentDate == appointment.AppointmentDate);

        if (doctorHasAppointment)
        {
            return BadRequest("Doctor already has an appointment at this time.");
        }

        var patientHasAppointment = await _context.Appointments.AnyAsync(a =>
            a.Id != id &&
            a.PatientId == appointment.PatientId &&
            a.AppointmentDate == appointment.AppointmentDate);

        if (patientHasAppointment)
        {
            return BadRequest("Patient already has an appointment at this time.");
        }

        existingAppointment.DoctorId = appointment.DoctorId;
        existingAppointment.PatientId = appointment.PatientId;
        existingAppointment.AppointmentDate = appointment.AppointmentDate;
        existingAppointment.Status = appointment.Status;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
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
}