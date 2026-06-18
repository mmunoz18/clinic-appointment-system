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
            var validationError = await ValidatePatientAsync(patient);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }
            
            patient.Name = patient.Name.Trim();
            patient.Email = patient.Email.Trim().ToLower();
            patient.Cedula = patient.Cedula.Trim();

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
            
            var validationError = await ValidatePatientAsync(patient, id);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var existingPatient = await _context.Patients.FindAsync(id);

            if (existingPatient == null)
            {
                return NotFound();
            }

            existingPatient.Name = patient.Name.Trim();
            existingPatient.Email = patient.Email.Trim().ToLower();
            existingPatient.Cedula = patient.Cedula.Trim();

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
                return NotFound("Patient not found.");
            }

            var hasAppointments = await _context.Appointments.AnyAsync(a => a.PatientId == id);

            if (hasAppointments)
            {
                return BadRequest("Cannot delete patient with scheduled appointments. Reassign or cancel appointments first.");
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

    private async Task<string?> ValidatePatientAsync(Patient patient, int? patientId = null)
    {
        if (string.IsNullOrWhiteSpace(patient.Name))
        {
            return "Patient name is required.";
        }

        if (string.IsNullOrWhiteSpace(patient.Email))
        {
            return "Patient email is required.";
        }

        if (string.IsNullOrWhiteSpace(patient.Cedula))
        {
            return "Patient cedula is required.";
        }

        if (patient.Cedula.Trim().Length != 9)
        {
            return "Patient cedula must be 9 characters long.";
        }

        var cedulaError = await ValidateCedulaIsUnique(patient.Cedula, patientId);
        if (cedulaError != null)
        {
            return cedulaError;
        }

        var normalizedEmail = patient.Email.Trim().ToLower();

        var emailExists = await _context.Patients.AnyAsync(p =>
            p.Email.ToLower() == normalizedEmail &&
            (!patientId.HasValue || p.Id != patientId.Value));

        if (emailExists)
        {
            return "A patient with this email already exists.";
        }

        return null;
    }

    private async Task<string?> ValidateCedulaIsUnique(string cedula, int? patientId = null)
    {
        var normalizedCedula = cedula.Trim();

        var cedulaExists = await _context.Patients.AnyAsync(p =>
            p.Cedula == normalizedCedula &&
            (!patientId.HasValue || p.Id != patientId.Value));

        if (cedulaExists)
        {
            return "Cedula is already registered.";
        }

        return null;
    }
}