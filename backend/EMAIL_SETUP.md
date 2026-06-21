# Email reminder setup

Manual appointment reminders use SMTP. Keep credentials outside source control
by setting configuration through environment variables or .NET user secrets.

Required settings:

```text
Email__Enabled=true
Email__Host=smtp.example.com
Email__Port=587
Email__EnableSsl=true
Email__Username=your-smtp-username
Email__Password=your-smtp-password
Email__FromEmail=appointments@example.com
Email__FromName=Clinic Team
```

For local development, run these commands from the `backend` directory:

```bash
dotnet user-secrets set "Email:Enabled" "true"
dotnet user-secrets set "Email:Host" "smtp.example.com"
dotnet user-secrets set "Email:Port" "587"
dotnet user-secrets set "Email:EnableSsl" "true"
dotnet user-secrets set "Email:Username" "your-smtp-username"
dotnet user-secrets set "Email:Password" "your-smtp-password"
dotnet user-secrets set "Email:FromEmail" "appointments@example.com"
dotnet user-secrets set "Email:FromName" "Clinic Team"
```
