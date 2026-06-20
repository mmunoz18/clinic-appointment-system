using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260620000000_AddIsActiveToUsers")]
public partial class AddIsActiveToUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsActive",
            table: "Users",
            type: "INTEGER",
            nullable: false,
            defaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "IsActive",
            table: "Users");
    }
}
