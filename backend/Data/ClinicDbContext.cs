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

    public DbSet<AuditLog> AuditLogs { get; set; }

    public DbSet<DoctorAvailability> DoctorAvailabilities { get; set; }

    public DbSet<PatientNote> PatientNotes { get; set; }

    public DbSet<ReminderSettings> ReminderSettings { get; set; }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Doctor>()
            .Property(doctor => doctor.IsActive)
            .HasDefaultValue(true);

        modelBuilder.Entity<Patient>()
            .Property(patient => patient.IsActive)
            .HasDefaultValue(true);

        modelBuilder.Entity<User>()
            .Property(user => user.IsActive)
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

        modelBuilder.Entity<PatientNote>()
            .HasOne(note => note.Patient)
            .WithMany(patient => patient.Notes)
            .HasForeignKey(note => note.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PatientNote>()
            .HasOne(note => note.Doctor)
            .WithMany(doctor => doctor.PatientNotes)
            .HasForeignKey(note => note.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PatientNote>()
            .Property(note => note.Note)
            .HasMaxLength(4000);

        modelBuilder.Entity<PatientNote>()
            .HasIndex(note => new { note.PatientId, note.CreatedAt });

        modelBuilder.Entity<AuditLog>()
            .HasIndex(log => log.CreatedAt);

        modelBuilder.Entity<AuditLog>()
            .HasIndex(log => new { log.EntityType, log.Action });

        modelBuilder.Entity<User>()
            .HasOne(user => user.Doctor)
            .WithOne(doctor => doctor.User)
            .HasForeignKey<User>(user => user.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReminderSettings>()
            .HasData(new ReminderSettings
            {
                Id = 1,
                Enabled = false,
                Send24HoursBefore = true,
                Send2HoursBefore = true
            });
    }
}
