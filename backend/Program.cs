using backend.Data;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ClinicDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Key"]!)
            )
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("AdminOrReceptionist", policy =>
        policy.RequireRole("Admin", "Receptionist"));

    options.AddPolicy("AdminOrDoctor", policy =>
        policy.RequireRole("Admin", "Doctor"));

    options.AddPolicy("AllRoles", policy =>
        policy.RequireRole("Admin", "Receptionist", "Doctor"));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ClinicDbContext>();

    if (!context.Doctors.Any())
    {
        context.Doctors.AddRange(
            new Doctor { Name = "Dr. Smith", Specialty = "Cardiology" },
            new Doctor { Name = "Dr. Johnson", Specialty = "Pediatrics" },
            new Doctor { Name = "Dr. Brown", Specialty = "Dermatology" }
        );

        context.SaveChanges();
    }
    if (!context.Patients.Any())
    {
        context.Patients.AddRange(
            new Patient
            {
                Name = "Maria Lopez",
                Email = "maria.lopez@email.com"
            },
            new Patient
            {
                Name = "Carlos Rodriguez",
                Email = "carlos.rodriguez@email.com"
            },
            new Patient
            {
                Name = "Ana Martinez",
                Email = "ana.martinez@email.com"
            },
            new Patient
            {
                Name = "Jose Gonzalez",
                Email = "jose.gonzalez@email.com"
            },
            new Patient
            {
                Name = "Sofia Vargas",
                Email = "sofia.vargas@email.com"
            }
        );

        context.SaveChanges();
    }

    if (!context.Appointments.Any())
    {
        var tomorrow = DateTime.Today.AddDays(1);

        context.Appointments.AddRange(
            new Appointment
            {
                DoctorId = 1,
                PatientId = 1,
                AppointmentDate = tomorrow.AddHours(9),
                Status = "Scheduled"
            },
            new Appointment
            {
                DoctorId = 1,
                PatientId = 2,
                AppointmentDate = tomorrow.AddHours(10),
                Status = "Scheduled"
            },
            new Appointment
            {
                DoctorId = 2,
                PatientId = 3,
                AppointmentDate = tomorrow.AddHours(11),
                Status = "Scheduled"
            },
            new Appointment
            {
                DoctorId = 3,
                PatientId = 4,
                AppointmentDate = tomorrow.AddDays(1).AddHours(9),
                Status = "Scheduled"
            },
            new Appointment
            {
                DoctorId = 2,
                PatientId = 5,
                AppointmentDate = tomorrow.AddDays(1).AddHours(14),
                Status = "Scheduled"
            }
        );

        context.SaveChanges();
    }
}

app.Run();