- [ ] Investigate frontend payload for login (email/password)
- [ ] Add temporary debug logs in login endpoint to identify failure reason (user not found vs password mismatch vs token generation)
- [ ] Verify Prisma schema field used for stored hash (User.password)
- [ ] Fix imported CSV placeholder password hashes: detect invalid hashes and regenerate bcrypt hash for "admin123" then upsert into DB
- [ ] Remove temporary debug logs
- [ ] Ensure login works for admin.001@example.com / admin123

