namespace backend.Models;

public class ReminderSettings
{
    public int Id { get; set; } = 1;

    public bool Enabled { get; set; }

    public bool Send24HoursBefore { get; set; } = true;

    public bool Send2HoursBefore { get; set; } = true;

    public DateTimeOffset? LastCheckAt { get; set; }

    public DateTimeOffset? LastReminderSentAt { get; set; }

    public DateTimeOffset? NextCheckAt { get; set; }
}
