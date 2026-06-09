using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<Patient>> GetPatients()
    {
        var patients = new List<Patient>
        {
            new Patient { Id = 1, Name = "Maria Lopez", Email = "maria.lopez@email.com" },
            new Patient { Id = 2, Name = "Carlos Rodriguez", Email = "carlos.rodriguez@email.com" },
            new Patient { Id = 3, Name = "Ana Martinez", Email = "ana.martinez@email.com" }
        };

        return Ok(patients);
    }
}