using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<Appointment>> GetAppointments()
    {
        var appointments = new List<Appointment>
        {
            new Appointment
            {
                Id = 1,
                DoctorId = 1,
                PatientId = 1,
                AppointmentDate = new DateTime(2026, 6, 15, 9, 0, 0),
                Status = "Scheduled"
            },
            new Appointment
            {
                Id = 2,
                DoctorId = 2,
                PatientId = 2,
                AppointmentDate = new DateTime(2026, 6, 15, 10, 0, 0),
                Status = "Scheduled"
            }
        };

        return Ok(appointments);
    }
}