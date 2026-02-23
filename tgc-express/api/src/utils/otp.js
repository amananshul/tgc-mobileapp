// MVP test OTP — swap with real SMS provider (Twilio, MSG91, etc.) in production
const TEST_OTP = "123456";
const OTP_EXPIRY_MINUTES = 10;

function generateOtp() {
  return TEST_OTP;
}

function otpExpiryDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

module.exports = { generateOtp, otpExpiryDate, TEST_OTP, OTP_EXPIRY_MINUTES };
