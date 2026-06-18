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

    public DbSet<DoctorAvailability> DoctorAvailabilities { get; set; }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Doctor>()
            .Property(doctor => doctor.IsActive)
            .HasDefaultValue(true);

        modelBuilder.Entity<Patient>()
            .Property(patient => patient.IsActive)
            .HasDefaultValue(true);

        modelBuilder.Entity<DoctorAvailability>()
            .Property(availability => availability.IsActive)
            .HasDefaultValue(true);

        modelBuilder.Entity<DoctorAvailability>()
            .HasOne(availability => availability.Doctor)
            .WithMany(doctor => doctor.Availabilities)
            .HasForeignKey(availability => availability.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DoctorAvailability>()
            .HasIndex(availability => new
            {
                availability.DoctorId,
                availability.DayOfWeek
            });

        modelBuilder.Entity<User>()
            .HasOne(user => user.Doctor)
            .WithOne(doctor => doctor.User)
            .HasForeignKey<User>(user => user.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
