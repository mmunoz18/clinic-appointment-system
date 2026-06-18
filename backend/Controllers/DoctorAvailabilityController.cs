using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
public class DoctorAvailabilityController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public DoctorAvailabilityController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet("/api/doctors/{doctorId}/availability")]
    public async Task<IActionResult> GetDoctorAvailability(int doctorId)
    {
        var doctorExists = await _context.Doctors
            .AsNoTracking()
            .AnyAsync(doctor => doctor.Id == doctorId);

        if (!doctorExists)
        {
            return NotFound("Doctor not found.");
        }

        var availability = await _context.DoctorAvailabilities
            .AsNoTracking()
            .Where(item => item.DoctorId == doctorId && item.IsActive)
            .OrderBy(item => item.DayOfWeek)
            .ThenBy(item => item.StartTime)
            .ToListAsync();

        return Ok(availability);
    }

    [HttpPost("/api/doctors/{doctorId}/availability")]
    public async Task<IActionResult> CreateDoctorAvailability(
        int doctorId,
        [FromBody] DoctorAvailabilityRequest request)
    {
        var doctorIsActive = await _context.Doctors.AnyAsync(doctor =>
            doctor.Id == doctorId && doctor.IsActive);

        if (!doctorIsActive)
        {
            return BadRequest("Doctor does not exist or is inactive.");
        }

        var validationError = await ValidateAvailabilityAsync(doctorId, request);
        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        var availability = new DoctorAvailability
        {
            DoctorId = doctorId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsActive = true
        };

        _context.DoctorAvailabilities.Add(availability);
        await _context.SaveChangesAsync();

        return Created(
            $"/api/doctors/{doctorId}/availability",
            availability);
    }

    [HttpPut("/api/doctor-availability/{id}")]
    public async Task<IActionResult> UpdateDoctorAvailability(
        int id,
        [FromBody] DoctorAvailabilityRequest request)
    {
        var availability = await _context.DoctorAvailabilities.FindAsync(id);

        if (availability == null)
        {
            return NotFound("Doctor availability not found.");
        }

        var doctorIsActive = await _context.Doctors.AnyAsync(doctor =>
            doctor.Id == availability.DoctorId && doctor.IsActive);

        if (!doctorIsActive)
        {
            return BadRequest("Doctor does not exist or is inactive.");
        }

        var validationError = await ValidateAvailabilityAsync(
            availability.DoctorId,
            request,
            id);

        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        availability.DayOfWeek = request.DayOfWeek;
        availability.StartTime = request.StartTime;
        availability.EndTime = request.EndTime;
        availability.IsActive = true;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("/api/doctor-availability/{id}")]
    public async Task<IActionResult> DeactivateDoctorAvailability(int id)
    {
        var availability = await _context.DoctorAvailabilities.FindAsync(id);

        if (availability == null)
        {
            return NotFound("Doctor availability not found.");
        }

        availability.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<string?> ValidateAvailabilityAsync(
        int doctorId,
        DoctorAvailabilityRequest request,
        int? availabilityId = null)
    {
        if (!Enum.IsDefined(request.DayOfWeek))
        {
            return "Invalid day of week.";
        }

        if (request.StartTime >= request.EndTime)
        {
            return "Start time must be earlier than end time.";
        }

        var activeWindows = await _context.DoctorAvailabilities
            .AsNoTracking()
            .Where(item =>
                item.DoctorId == doctorId &&
                item.DayOfWeek == request.DayOfWeek &&
                item.IsActive &&
                (!availabilityId.HasValue || item.Id != availabilityId.Value))
            .ToListAsync();

        var overlaps = activeWindows.Any(item =>
            request.StartTime < item.EndTime &&
            request.EndTime > item.StartTime);

        if (overlaps)
        {
            return "Doctor availability overlaps an existing time window.";
        }

        return null;
    }
}

public class DoctorAvailabilityRequest
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
