using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class ClinicDbContext : DbContext
{
    public ClinicDbContext(DbContextOptions<ClinicDbContext> options)
        : base(options)
    {
    }

    public DbSet<Doctor> Doctors { get; set; }

    public DbSet<Patient> Patients { get; set; }

    public DbSet<Appointment> Appointments { get; set; }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasOne(user => user.Doctor)
            .WithOne(doctor => doctor.User)
            .HasForeignKey<User>(user => user.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
