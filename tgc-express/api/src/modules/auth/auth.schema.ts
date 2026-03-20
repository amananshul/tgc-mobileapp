import { z } from "zod";

const baseRegisterSchema = z.object({
  identifier: z.string().trim().min(1, "Phone number or email is required").optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().trim().min(6, "Phone number looks too short").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
});

const registerSchema = baseRegisterSchema
  .refine((data) => Boolean(data.identifier || data.email || data.phone), {
    message: "Provide either phone number or email",
    path: ["identifier"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Phone number or email is required").optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().trim().min(6, "Phone number looks too short").optional(),
  password: z.string().min(1, "Password is required"),
}).refine(data => Boolean(data.identifier || data.email || data.phone), {
  message: "Phone number or email is required",
  path: ["identifier"],
});

const verifyOtpSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  otp: z.string().min(1, "OTP is required"),
});

const resendOtpSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, refreshSchema };
