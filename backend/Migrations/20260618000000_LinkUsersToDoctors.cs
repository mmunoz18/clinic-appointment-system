using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260618000000_LinkUsersToDoctors")]
public partial class LinkUsersToDoctors : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "DoctorId",
            table: "Users",
            type: "INTEGER",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Users_DoctorId",
            table: "Users",
            column: "DoctorId",
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_Users_Doctors_DoctorId",
            table: "Users",
            column: "DoctorId",
            principalTable: "Doctors",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Users_Doctors_DoctorId",
            table: "Users");

        migrationBuilder.DropIndex(
            name: "IX_Users_DoctorId",
            table: "Users");

        migrationBuilder.DropColumn(
            name: "DoctorId",
            table: "Users");
    }
}
