using System;
using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260621010000_AddReminderExecutionTracking")]
public partial class AddReminderExecutionTracking : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "LastCheckAt",
            table: "ReminderSettings",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "LastReminderSentAt",
            table: "ReminderSettings",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "NextCheckAt",
            table: "ReminderSettings",
            type: "TEXT",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "LastCheckAt",
            table: "ReminderSettings");

        migrationBuilder.DropColumn(
            name: "LastReminderSentAt",
            table: "ReminderSettings");

        migrationBuilder.DropColumn(
            name: "NextCheckAt",
            table: "ReminderSettings");
    }
}
