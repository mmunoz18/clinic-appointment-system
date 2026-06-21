namespace backend.Models;

public class Appointment
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public DateTime AppointmentDate { get; set; }

    public string Status { get; set; } = "Scheduled";

    public DateTimeOffset? ManualReminderSentAt { get; set; }

    public DateTimeOffset? Reminder24HoursSentAt { get; set; }

    public DateTimeOffset? Reminder2HoursSentAt { get; set; }

    public DateTimeOffset? ReminderLastAttemptAt { get; set; }

    public string? ReminderLastError { get; set; }
}
