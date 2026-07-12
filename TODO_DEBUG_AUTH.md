# Authentication debugging checklist (temporary)

- [ ] Add targeted temporary logs (only during login) to pinpoint failure path
- [ ] Determine whether DB has placeholder passwordHash values (users.csv)
- [ ] Auto-fix seed CSV placeholder hashes by generating real bcrypt hashes for admin123
- [ ] Remove logs after fix
- [ ] Validate login with admin.001@example.com / admin123

