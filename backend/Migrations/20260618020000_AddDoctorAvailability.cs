using System;
using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260618020000_AddDoctorAvailability")]
public partial class AddDoctorAvailability : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "DoctorAvailabilities",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                DoctorId = table.Column<int>(type: "INTEGER", nullable: false),
                DayOfWeek = table.Column<int>(type: "INTEGER", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                IsActive = table.Column<bool>(
                    type: "INTEGER",
                    nullable: false,
                    defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DoctorAvailabilities", x => x.Id);
                table.ForeignKey(
                    name: "FK_DoctorAvailabilities_Doctors_DoctorId",
                    column: x => x.DoctorId,
                    principalTable: "Doctors",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_DoctorAvailabilities_DoctorId_DayOfWeek",
            table: "DoctorAvailabilities",
            columns: new[] { "DoctorId", "DayOfWeek" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "DoctorAvailabilities");
    }
}
