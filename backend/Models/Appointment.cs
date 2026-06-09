namespace backend.Models;

public class Appointment
{
    public int Id { get; set; }

    public int DoctorId { get; set; }

    public int PatientId { get; set; }

    public DateTime AppointmentDate { get; set; }

    public string Status { get; set; } = "Scheduled";
}