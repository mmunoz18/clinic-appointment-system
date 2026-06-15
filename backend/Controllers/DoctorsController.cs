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
    public async Task<ActionResult<IEnumerable<Doctor>>> GetDoctors()
    {
        var doctors = await _context.Doctors.ToListAsync();

        return Ok(doctors);
    }

    [HttpGet("{id}")]
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
    public async Task<ActionResult<Doctor>> CreateDoctor(Doctor doctor)
    {
        try
        {
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
    public async Task<IActionResult> UpdateDoctor(int id, Doctor doctor)
    {
        try
        {
            if (id != doctor.Id)
            {
                return BadRequest();
            }

            var existingDoctor = await _context.Doctors.FindAsync(id);

            if (existingDoctor == null)
            {
                return NotFound();
            }

            existingDoctor.Name = doctor.Name;
            existingDoctor.Specialty = doctor.Specialty;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDoctor(int id)
    {
        try
        {
            var doctor = await _context.Doctors.FindAsync(id);

            if (doctor == null)
            {
                return NotFound();
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
}