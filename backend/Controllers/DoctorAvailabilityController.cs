using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Authorize]
public class DoctorAvailabilityController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public DoctorAvailabilityController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet("/api/doctors/{doctorId}/availability")]
    [Authorize(Policy = "AllRoles")]
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

    [HttpGet("/api/doctor-profile")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetLoggedInDoctorProfile()
    {
        var doctorId = await GetLoggedInDoctorIdAsync();

        if (!doctorId.HasValue)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Your user account is not linked to a doctor profile.");
        }

        var doctor = await _context.Doctors
            .AsNoTracking()
            .Where(doctor => doctor.Id == doctorId.Value)
            .Select(doctor => new
            {
                doctor.Id,
                doctor.Name,
                doctor.Specialty,
                doctor.Cedula,
                doctor.IsActive
            })
            .SingleOrDefaultAsync();

        if (doctor == null)
        {
            return NotFound("Doctor profile not found.");
        }

        return Ok(doctor);
    }

    [HttpPost("/api/doctors/{doctorId}/availability")]
    [Authorize(Policy = "AllRoles")]
    public async Task<IActionResult> CreateDoctorAvailability(
        int doctorId,
        [FromBody] DoctorAvailabilityRequest request)
    {
        if (!await CanEditAvailabilityAsync(doctorId))
        {
            return Forbid();
        }

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
    [Authorize(Policy = "AllRoles")]
    public async Task<IActionResult> UpdateDoctorAvailability(
        int id,
        [FromBody] DoctorAvailabilityRequest request)
    {
        var availability = await _context.DoctorAvailabilities.FindAsync(id);

        if (availability == null)
        {
            return NotFound("Doctor availability not found.");
        }

        if (!await CanEditAvailabilityAsync(availability.DoctorId))
        {
            return Forbid();
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
    [Authorize(Policy = "AllRoles")]
    public async Task<IActionResult> DeactivateDoctorAvailability(int id)
    {
        var availability = await _context.DoctorAvailabilities.FindAsync(id);

        if (availability == null)
        {
            return NotFound("Doctor availability not found.");
        }

        if (!await CanEditAvailabilityAsync(availability.DoctorId))
        {
            return Forbid();
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

    private async Task<bool> CanEditAvailabilityAsync(int doctorId)
    {
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        if (!User.IsInRole("Doctor"))
        {
            return false;
        }

        var loggedInDoctorId = await GetLoggedInDoctorIdAsync();

        return loggedInDoctorId.HasValue &&
            loggedInDoctorId.Value == doctorId;
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
}

public class DoctorAvailabilityRequest
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
