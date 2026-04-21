export const OTP_TYPES = ['register', 'reset_password'] as const;
export type OtpType = (typeof OTP_TYPES)[number];

export const DEFAULT_OTP_TYPE: OtpType = 'register';
