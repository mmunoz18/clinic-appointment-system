using backend.Data;
using backend.Models;
using backend.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ClinicDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(ClinicDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [Authorize]
    [HttpGet("profile")]
    public IActionResult Profile()
    {
        return Ok("You are authenticated.");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            var validationError = await ValidateRegisterRequestAsync(request);

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                Email = request.Email.Trim().ToLower(),
                Role = "Admin"
            };

            var passwordHasher = new PasswordHasher<User>();
            user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An error occurred: " + ex.Message);
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return Unauthorized("Invalid email or password.");
            }

            var normalizedEmail = request.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            var passwordHasher = new PasswordHasher<User>();

            var result = passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                return Unauthorized("User account is inactive.");
            }

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email,
                Name = user.Name,
                Role = user.Role
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, "An error occurred: " + ex.Message);
        }
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string?> ValidateRegisterRequestAsync(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Name is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "Email is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return "Password is required.";
        }

        if (request.Password.Length < 6)
        {
            return "Password must be at least 6 characters.";
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        var emailExists = await _context.Users.AnyAsync(u =>
            u.Email.ToLower() == normalizedEmail);

        if (emailExists)
        {
            return "Email is already registered.";
        }

        return null;
    }
}
