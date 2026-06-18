using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class UsersController : ControllerBase
{
    private readonly ClinicDbContext _context;

    public UsersController(ClinicDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Include(u => u.Doctor)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.DoctorId,
                DoctorName = u.Doctor != null ? u.Doctor.Name : null
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request)
    {
        var allowedRoles = new[] { "Admin", "Receptionist", "Doctor" };

        if (!allowedRoles.Contains(request.Role))
        {
            return BadRequest("Invalid role.");
        }

        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        if (request.Role == "Doctor")
        {
            if (!request.DoctorId.HasValue)
            {
                return BadRequest("A doctor profile must be assigned to users with the Doctor role.");
            }

            var doctorExists = await _context.Doctors.AnyAsync(d =>
                d.Id == request.DoctorId.Value && d.IsActive);
            if (!doctorExists)
            {
                return BadRequest("The selected doctor does not exist or is inactive.");
            }

            var doctorAlreadyAssigned = await _context.Users.AnyAsync(u =>
                u.DoctorId == request.DoctorId.Value && u.Id != id);

            if (doctorAlreadyAssigned)
            {
                return BadRequest("The selected doctor is already linked to another user.");
            }
        }

        user.Role = request.Role;
        user.DoctorId = request.Role == "Doctor" ? request.DoctorId : null;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
    public int? DoctorId { get; set; }
}
