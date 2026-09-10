function toSafeUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    level: user.level,
    studentNumber: user.student_number,
  };
}

module.exports = { toSafeUser };
