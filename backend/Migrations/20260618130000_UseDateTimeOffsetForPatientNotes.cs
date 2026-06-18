using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260618130000_UseDateTimeOffsetForPatientNotes")]
public partial class UseDateTimeOffsetForPatientNotes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE PatientNotes
            SET CreatedAt = CreatedAt || '+00:00'
            WHERE CreatedAt NOT LIKE '%Z'
              AND CreatedAt NOT GLOB '*[+-][0-9][0-9]:[0-9][0-9]';
            """);

        migrationBuilder.Sql(
            """
            UPDATE PatientNotes
            SET UpdatedAt = UpdatedAt || '+00:00'
            WHERE UpdatedAt NOT LIKE '%Z'
              AND UpdatedAt NOT GLOB '*[+-][0-9][0-9]:[0-9][0-9]';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE PatientNotes
            SET CreatedAt = REPLACE(CreatedAt, '+00:00', '')
            WHERE CreatedAt LIKE '%+00:00';
            """);

        migrationBuilder.Sql(
            """
            UPDATE PatientNotes
            SET UpdatedAt = REPLACE(UpdatedAt, '+00:00', '')
            WHERE UpdatedAt LIKE '%+00:00';
            """);
    }
}
