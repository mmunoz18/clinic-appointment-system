using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Authorize(Policy = "AdminOrDoctor")]
public class PatientNotesController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public PatientNotesController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet("/api/patients/{patientId}/notes")]
    public async Task<IActionResult> GetPatientNotes(int patientId)
    {
        var accessError = await ValidatePatientAccessAsync(patientId);
        if (accessError != null)
        {
            return accessError;
        }

        var isDoctor = User.IsInRole("Doctor");
        int? loggedInDoctorId = null;
        var notesQuery = _context.PatientNotes
            .AsNoTracking()
            .Where(note => note.PatientId == patientId);

        if (isDoctor)
        {
            loggedInDoctorId = await GetLoggedInDoctorIdAsync();
            if (!loggedInDoctorId.HasValue)
            {
                return Forbid();
            }

            notesQuery = notesQuery.Where(note =>
                note.DoctorId == loggedInDoctorId.Value);
        }

        var notes = await notesQuery
            .OrderByDescending(note => note.CreatedAt)
            .Select(note => new
            {
                note.Id,
                note.PatientId,
                note.DoctorId,
                DoctorName = note.Doctor != null ? note.Doctor.Name : "",
                note.Note,
                note.CreatedAt,
                note.UpdatedAt,
                CanEdit = isDoctor &&
                    loggedInDoctorId.HasValue &&
                    note.DoctorId == loggedInDoctorId.Value
            })
            .ToListAsync();

        return Ok(notes);
    }

    [HttpPost("/api/patients/{patientId}/notes")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> CreatePatientNote(
        int patientId,
        [FromBody] PatientNoteRequest request)
    {
        var accessError = await ValidatePatientAccessAsync(patientId);
        if (accessError != null)
        {
            return accessError;
        }

        var validationError = ValidateNote(request.Note);
        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        var doctorId = await GetLoggedInDoctorIdAsync();
        if (!doctorId.HasValue)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Your user account is not linked to a doctor profile.");
        }

        var now = DateTime.UtcNow;
        var note = new PatientNote
        {
            PatientId = patientId,
            DoctorId = doctorId.Value,
            Note = request.Note.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.PatientNotes.Add(note);
        await _context.SaveChangesAsync();

        return Created($"/api/patients/{patientId}/notes", new
        {
            note.Id,
            note.PatientId,
            note.DoctorId,
            note.Note,
            note.CreatedAt,
            note.UpdatedAt
        });
    }

    [HttpPut("/api/patient-notes/{id}")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> UpdatePatientNote(
        int id,
        [FromBody] PatientNoteRequest request)
    {
        var validationError = ValidateNote(request.Note);
        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        var doctorId = await GetLoggedInDoctorIdAsync();
        if (!doctorId.HasValue)
        {
            return Forbid();
        }

        var note = await _context.PatientNotes.FindAsync(id);
        if (note == null)
        {
            return NotFound("Patient note not found.");
        }

        if (note.DoctorId != doctorId.Value)
        {
            return Forbid();
        }

        var isOwnPatient = await DoctorHasPatientAsync(
            doctorId.Value,
            note.PatientId);

        if (!isOwnPatient)
        {
            return Forbid();
        }

        note.Note = request.Note.Trim();
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?> ValidatePatientAccessAsync(int patientId)
    {
        var patientExists = await _context.Patients
            .AsNoTracking()
            .AnyAsync(patient => patient.Id == patientId);

        if (!patientExists)
        {
            return NotFound("Patient not found.");
        }

        if (User.IsInRole("Admin"))
        {
            return null;
        }

        var doctorId = await GetLoggedInDoctorIdAsync();
        if (!doctorId.HasValue)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Your user account is not linked to a doctor profile.");
        }

        if (!await DoctorHasPatientAsync(doctorId.Value, patientId))
        {
            return Forbid();
        }

        return null;
    }

    private async Task<bool> DoctorHasPatientAsync(int doctorId, int patientId)
    {
        return await _context.Appointments
            .AsNoTracking()
            .AnyAsync(appointment =>
                appointment.DoctorId == doctorId &&
                appointment.PatientId == patientId);
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

    private static string? ValidateNote(string note)
    {
        if (string.IsNullOrWhiteSpace(note))
        {
            return "Note is required.";
        }

        if (note.Trim().Length > 4000)
        {
            return "Note cannot exceed 4000 characters.";
        }

        return null;
    }
}

public class PatientNoteRequest
{
    public string Note { get; set; } = string.Empty;
}
