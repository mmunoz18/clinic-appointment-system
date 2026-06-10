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
        var appointments = await _context.Appointments.ToListAsync();

        return Ok(appointments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Appointment>> GetAppointment(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);

        if (appointment == null)
        {
            return NotFound();
        }

        return Ok(appointment);
    }

    [HttpPost]
    public async Task<ActionResult<Appointment>> CreateAppointment(Appointment appointment)
    {
        var exists = await _context.Appointments.AnyAsync(a => a.DoctorId == appointment.DoctorId &&
         a.AppointmentDate == appointment.AppointmentDate);
         
        if (exists)
        {
            return BadRequest("Appointment already exists for this doctor at this time");
        }

        if (appointment.AppointmentDate <= DateTime.Now)
        {
            return BadRequest("Appointments must be scheduled in the future.");
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