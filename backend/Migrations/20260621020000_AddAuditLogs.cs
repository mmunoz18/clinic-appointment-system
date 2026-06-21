using System;
using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

[DbContext(typeof(ClinicDbContext))]
[Migration("20260621020000_AddAuditLogs")]
public partial class AddAuditLogs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AuditLogs",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                EntityType = table.Column<string>(
                    type: "TEXT",
                    nullable: false),
                EntityId = table.Column<int>(
                    type: "INTEGER",
                    nullable: false),
                Action = table.Column<string>(
                    type: "TEXT",
                    nullable: false),
                Details = table.Column<string>(
                    type: "TEXT",
                    nullable: true),
                UserId = table.Column<int>(
                    type: "INTEGER",
                    nullable: true),
                UserName = table.Column<string>(
                    type: "TEXT",
                    nullable: false),
                CreatedAt = table.Column<DateTime>(
                    type: "TEXT",
                    nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditLogs", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_CreatedAt",
            table: "AuditLogs",
            column: "CreatedAt");

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_EntityType_Action",
            table: "AuditLogs",
            columns: new[] { "EntityType", "Action" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AuditLogs");
    }
}
