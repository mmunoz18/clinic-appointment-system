using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260621233000_AddAuditLogEntityName")]
public partial class AddAuditLogEntityName : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "EntityName",
            table: "AuditLogs",
            type: "TEXT",
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE AuditLogs
            SET EntityName = (
                SELECT Users.Name
                FROM Users
                WHERE Users.Id = AuditLogs.EntityId
            )
            WHERE EntityType = 'User';
            """);

        migrationBuilder.Sql(
            """
            UPDATE AuditLogs
            SET EntityName = (
                SELECT Doctors.Name
                FROM Doctors
                WHERE Doctors.Id = AuditLogs.EntityId
            )
            WHERE EntityType = 'Doctor';
            """);

        migrationBuilder.Sql(
            """
            UPDATE AuditLogs
            SET EntityName = (
                SELECT Patients.Name
                FROM Patients
                WHERE Patients.Id = AuditLogs.EntityId
            )
            WHERE EntityType = 'Patient';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "EntityName",
            table: "AuditLogs");
    }
}
