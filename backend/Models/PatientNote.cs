namespace backend.Models;

public class PatientNote
{
    public int Id { get; set; }

    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public string Note { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
