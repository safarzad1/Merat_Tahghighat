import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || "my_test_secret_key_123";

export function encryptText(text: string): string {
  if (!text) return "";

  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  return encrypted;
}

export function decryptText(cipherText: string): string {
  if (!cipherText) return "";

  console.log("🧩 [DecryptText]");
  console.log("Cipher Text (input):", cipherText);
  console.log("Secret Key:", SECRET_KEY);

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    console.log("Decrypted Text:", decrypted);

    return decrypted || "";
  } catch (error) {
    console.error("❌ خطا در رمزگشایی:", error);
    return "";
  }
}

