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
    public async Task<ActionResult<IEnumerable<Doctor>>> GetDoctors()
    {
        var doctors = await _context.Doctors.ToListAsync();

        return Ok(doctors);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "AllRoles")]
    public async Task<ActionResult<Doctor>> GetDoctor(int id)
    {
        var doctor = await _context.Doctors.FindAsync(id);

        if (doctor == null)
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

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDoctor),
                new { id = doctor.Id },
                doctor
            );
        }
        catch (Exception ex)
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
        catch (Exception ex)
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteDoctor(int id)
    {
        try
        {
            var doctor = await _context.Doctors.FindAsync(id);

            if (doctor == null)
            {
                return NotFound("Doctor not found.");
            }

            var hasAppointments = await _context.Appointments.AnyAsync(a => a.DoctorId == id);

            if (hasAppointments)
            {
                return BadRequest("Cannot delete doctor with scheduled appointments. Reassign or cancel appointments first.");
            }

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
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