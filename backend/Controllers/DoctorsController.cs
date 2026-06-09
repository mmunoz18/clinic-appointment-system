using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<Doctor>> GetDoctors()
    {
        var doctors = new List<Doctor>
        {
            new Doctor { Id = 1, Name = "Dr. Smith", Specialty = "Cardiology" },
            new Doctor { Id = 2, Name = "Dr. Johnson", Specialty = "Pediatrics" },
            new Doctor { Id = 3, Name = "Dr. Brown", Specialty = "Dermatology" }
        };

        return Ok(doctors);
    }
}