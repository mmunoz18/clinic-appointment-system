namespace backend.Models;

public class Doctor
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Specialty { get; set; } = "";
    public string Cedula { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public User? User { get; set; }
    public ICollection<DoctorAvailability> Availabilities { get; set; } = [];
}
