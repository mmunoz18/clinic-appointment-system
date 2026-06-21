using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/reminder-settings")]
[Authorize(Policy = "AdminOnly")]
public class ReminderSettingsController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public ReminderSettingsController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await GetOrCreateSettingsAsync();

        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] ReminderSettingsRequest request)
    {
        if (request.Enabled &&
            !request.Send24HoursBefore &&
            !request.Send2HoursBefore)
        {
            return BadRequest(
                "Select at least one reminder time before enabling automatic reminders.");
        }

        var settings = await GetOrCreateSettingsAsync();
        var wasEnabled = settings.Enabled;
        settings.Enabled = request.Enabled;
        settings.Send24HoursBefore = request.Send24HoursBefore;
        settings.Send2HoursBefore = request.Send2HoursBefore;

        if (!settings.Enabled)
        {
            settings.NextCheckAt = null;
        }
        else if (!wasEnabled || !settings.NextCheckAt.HasValue)
        {
            settings.NextCheckAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(settings);
    }

    private async Task<ReminderSettings> GetOrCreateSettingsAsync()
    {
        var settings = await _context.ReminderSettings
            .SingleOrDefaultAsync(reminderSettings =>
                reminderSettings.Id == 1);

        if (settings != null)
        {
            return settings;
        }

        settings = new ReminderSettings();
        _context.ReminderSettings.Add(settings);
        await _context.SaveChangesAsync();

        return settings;
    }
}

public class ReminderSettingsRequest
{
    public bool Enabled { get; set; }
    public bool Send24HoursBefore { get; set; }
    public bool Send2HoursBefore { get; set; }
}
