using System;
using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260621000000_AddAppointmentReminderAutomation")]
public partial class AddAppointmentReminderAutomation : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "ManualReminderSentAt",
            table: "Appointments",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "Reminder24HoursSentAt",
            table: "Appointments",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "Reminder2HoursSentAt",
            table: "Appointments",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ReminderLastError",
            table: "Appointments",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "ReminderLastAttemptAt",
            table: "Appointments",
            type: "TEXT",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "ReminderSettings",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                Send24HoursBefore = table.Column<bool>(
                    type: "INTEGER",
                    nullable: false),
                Send2HoursBefore = table.Column<bool>(
                    type: "INTEGER",
                    nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReminderSettings", x => x.Id);
            });

        migrationBuilder.InsertData(
            table: "ReminderSettings",
            columns: new[]
            {
                "Id",
                "Enabled",
                "Send24HoursBefore",
                "Send2HoursBefore"
            },
            values: new object[] { 1, false, true, true });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ReminderSettings");

        migrationBuilder.DropColumn(
            name: "ManualReminderSentAt",
            table: "Appointments");

        migrationBuilder.DropColumn(
            name: "Reminder24HoursSentAt",
            table: "Appointments");

        migrationBuilder.DropColumn(
            name: "Reminder2HoursSentAt",
            table: "Appointments");

        migrationBuilder.DropColumn(
            name: "ReminderLastError",
            table: "Appointments");

        migrationBuilder.DropColumn(
            name: "ReminderLastAttemptAt",
            table: "Appointments");
    }
}
