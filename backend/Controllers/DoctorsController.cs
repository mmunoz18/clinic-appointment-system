using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public DoctorsController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Policy = "AllRoles")]
    public async Task<IActionResult> GetDoctors(
        [FromQuery] bool includeInactive = false)
    {
        var query = _context.Doctors.AsNoTracking();

        if (!includeInactive || !User.IsInRole("Admin"))
        {
            query = query.Where(doctor => doctor.IsActive);
        }

        var doctors = await query
            .Select(doctor => new
            {
                doctor.Id,
                doctor.Name,
                doctor.Specialty,
                doctor.Cedula,
                doctor.IsActive,
                HasLinkedUser = doctor.User != null,
                LinkedUserIsActive = doctor.User != null && doctor.User.IsActive
            })
            .ToListAsync();

        return Ok(doctors);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "AllRoles")]
    public async Task<IActionResult> GetDoctor(int id)
    {
        var doctor = await _context.Doctors
            .AsNoTracking()
            .Where(existingDoctor => existingDoctor.Id == id)
            .Select(existingDoctor => new
            {
                existingDoctor.Id,
                existingDoctor.Name,
                existingDoctor.Specialty,
                existingDoctor.Cedula,
                existingDoctor.IsActive,
                HasLinkedUser = existingDoctor.User != null,
                LinkedUserIsActive =
                    existingDoctor.User != null &&
                    existingDoctor.User.IsActive
            })
            .SingleOrDefaultAsync();

        if (doctor == null)
        {
            return NotFound();
        }

        if (!doctor.IsActive && !User.IsInRole("Admin"))
        {
            return NotFound();
        }

        return Ok(doctor);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<Doctor>> CreateDoctor(Doctor doctor)
    {
        try
        {
            var validationError = await ValidateDoctorAsync(doctor);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }
            
            doctor.Name = doctor.Name.Trim();
            doctor.Specialty = doctor.Specialty.Trim();
            doctor.Cedula = doctor.Cedula.Trim();
            doctor.IsActive = true;

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDoctor),
                new { id = doctor.Id },
                doctor
            );
        }
        catch
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateDoctor(int id, Doctor doctor)
    {
        try
        {
            if (id != doctor.Id)
            {
                return BadRequest();
            }
            
            var validationError = await ValidateDoctorAsync(doctor, id);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var existingDoctor = await _context.Doctors.FindAsync(id);

            if (existingDoctor == null)
            {
                return NotFound();
            }

            existingDoctor.Name = doctor.Name.Trim();
            existingDoctor.Specialty = doctor.Specialty.Trim();
            existingDoctor.Cedula = doctor.Cedula.Trim();

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpPut("{id}/deactivate")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeactivateDoctor(int id)
    {
        var doctor = await _context.Doctors
            .Include(existingDoctor => existingDoctor.User)
            .SingleOrDefaultAsync(existingDoctor => existingDoctor.Id == id);

        if (doctor == null)
        {
            return NotFound("Doctor not found.");
        }

        var hasFutureAppointments = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == id &&
            a.AppointmentDate > DateTime.Now &&
            a.Status == "Scheduled");

        if (hasFutureAppointments)
        {
            return BadRequest("Cannot deactivate doctor with scheduled future appointments.");
        }

        doctor.IsActive = false;

        if (doctor.User != null)
        {
            doctor.User.IsActive = false;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/activate")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ActivateDoctor(
        int id,
        [FromQuery] bool activateLinkedUser = false)
    {
        var doctor = await _context.Doctors
            .Include(existingDoctor => existingDoctor.User)
            .SingleOrDefaultAsync(existingDoctor => existingDoctor.Id == id);

        if (doctor == null)
        {
            return NotFound("Doctor not found.");
        }

        doctor.IsActive = true;

        if (activateLinkedUser && doctor.User != null)
        {
            doctor.User.IsActive = true;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<string?> ValidateDoctorAsync(Doctor doctor, int? doctorId = null)
    {
        if (string.IsNullOrWhiteSpace(doctor.Name))
        {
            return "Doctor name is required.";
        }

        if (string.IsNullOrWhiteSpace(doctor.Specialty))
        {
            return "Doctor specialty is required.";
        }

        if (string.IsNullOrWhiteSpace(doctor.Cedula))
        {
            return "Doctor cedula is required.";
        }
        
        if (doctor.Cedula.Trim().Length != 9)
        {
            return "Doctor cedula must be 9 characters long.";
        }

        var cedulaError = await ValidateCedulaIsUnique(doctor.Cedula, doctorId);
        if (cedulaError != null)
        {
            return cedulaError;
        }

        return null;
    }

    private async Task<string?> ValidateCedulaIsUnique(string cedula, int? doctorId = null)
    {
        var normalizedCedula = cedula.Trim();

        var cedulaExists = await _context.Doctors.AnyAsync(d =>
            d.Cedula == normalizedCedula &&
            (!doctorId.HasValue || d.Id != doctorId.Value));

        if (cedulaExists)
        {
            return "Cedula is already registered.";
        }

        return null;
    }
}
