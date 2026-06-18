using System;
using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260618030000_AddPatientNotes")]
public partial class AddPatientNotes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "PatientNotes",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                PatientId = table.Column<int>(type: "INTEGER", nullable: false),
                DoctorId = table.Column<int>(type: "INTEGER", nullable: false),
                Note = table.Column<string>(
                    type: "TEXT",
                    maxLength: 4000,
                    nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PatientNotes", x => x.Id);
                table.ForeignKey(
                    name: "FK_PatientNotes_Doctors_DoctorId",
                    column: x => x.DoctorId,
                    principalTable: "Doctors",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_PatientNotes_Patients_PatientId",
                    column: x => x.PatientId,
                    principalTable: "Patients",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PatientNotes_DoctorId",
            table: "PatientNotes",
            column: "DoctorId");

        migrationBuilder.CreateIndex(
            name: "IX_PatientNotes_PatientId_CreatedAt",
            table: "PatientNotes",
            columns: new[] { "PatientId", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "PatientNotes");
    }
}
