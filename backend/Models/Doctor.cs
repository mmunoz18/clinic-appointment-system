namespace backend.Models;

public class Doctor
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Specialty { get; set; } = "";
    public string Cedula { get; set; } = "";
    public User? User { get; set; }
}
