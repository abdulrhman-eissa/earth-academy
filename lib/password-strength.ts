/**
 * فحص قوة كلمة المرور
 */

export interface PasswordStrength {
  score: number; // 0-4
  label: string; // ضعيفة / متوسطة / قوية / قوية جداً
  color: string;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
    notCommon: boolean;
  };
}

const COMMON_PASSWORDS = [
  "password", "12345678", "123456789", "qwerty", "qwerty123", "11111111",
  "00000000", "1234567890", "password1", "admin123", "letmein", "welcome",
  "monkey", "dragon", "football", "baseball", "abc123", "iloveyou",
  "87654321", "test1234", "student123", "student@123", "faculty123",
  "admin@123", "affairs@123", "aaaaaaaa", "qwertyuiop", "1q2w3e4r",
  "123123123", "zaq12wsx", "asdfghjkl", "password123", "sunshine",
  "princess", "sunshine1", "1qaz2wsx", "zaq1zaq1", "1234abcd",
];

export function checkPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    notCommon: !COMMON_PASSWORDS.some((p) => password.toLowerCase().includes(p)),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  let score = 0;
  if (passedCount >= 2) score = 1;
  if (passedCount >= 4) score = 2;
  if (passedCount >= 5 && password.length >= 10) score = 3;
  if (passedCount >= 6 && password.length >= 12) score = 4;

  const labels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"];
  const colors = ["#dc2626", "#ef4444", "#f59e0b", "#10b981", "#059669"];

  return {
    score,
    label: labels[score],
    color: colors[score],
    checks,
  };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 10) {
    return { valid: false, error: "كلمة المرور يجب أن تكون 10 أحرف على الأقل" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل" };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, error: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (! @ # $ ...)" };
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.some((p) => lower.includes(p))) {
    return { valid: false, error: "كلمة المرور ضعيفة جداً — اختر كلمة مرور أقوى" };
  }

  return { valid: true };
}

export function getPasswordRequirements(password: string) {
  return [
    { text: "10 أحرف على الأقل", ok: password.length >= 10 },
    { text: "حرف صغير (a-z)", ok: /[a-z]/.test(password) },
    { text: "حرف كبير (A-Z)", ok: /[A-Z]/.test(password) },
    { text: "رقم (0-9)", ok: /[0-9]/.test(password) },
    { text: "رمز خاص (! @ # $ ...)", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) },
    { text: "غير شائعة", ok: !COMMON_PASSWORDS.some((p) => password.toLowerCase().includes(p)) },
  ];
}
