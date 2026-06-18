namespace backend.Models;

public class Patient
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Cedula { get; set; } = "";
    public string? PhoneNumber { get; set; }
}