using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public PatientsController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Policy = "AdminOrReceptionist")]
    public async Task<ActionResult<IEnumerable<Patient>>> GetPatients()
    {
        var patients = await _context.Patients.ToListAsync();

        return Ok(patients);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "AdminOrReceptionist")]
    public async Task<ActionResult<Patient>> GetPatient(int id)
    {
        var patient = await _context.Patients.FindAsync(id);

        if (patient == null)
        {
            return NotFound();
        }

        return Ok(patient);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOrReceptionist")]
    public async Task<ActionResult<Patient>> CreatePatient(Patient patient)
    {
        try
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPatient),
                new { id = patient.Id },
                patient
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOrReceptionist")]
    public async Task<IActionResult> UpdatePatient(int id, Patient patient)
    {
        try
        {
            if (id != patient.Id)
            {
                return BadRequest();
            }

            var existingPatient = await _context.Patients.FindAsync(id);

            if (existingPatient == null)
            {
                return NotFound();
            }

            existingPatient.Name = patient.Name;
            existingPatient.Email = patient.Email;

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
    public async Task<IActionResult> DeletePatient(int id)
    {
        try
        {
            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
            {
                return NotFound();
            }

            _context.Patients.Remove(patient);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An unexpected error occurred.");
        }
    }
}