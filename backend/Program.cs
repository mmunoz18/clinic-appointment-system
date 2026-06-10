using backend.Data;
using Microsoft.EntityFrameworkCore;
using backend.Models;

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

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
}

app.Run();