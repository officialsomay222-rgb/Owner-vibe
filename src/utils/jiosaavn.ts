import CryptoJS from 'crypto-js';

export const decryptUrl = (encryptedMediaUrl: string): string => {
  if (!encryptedMediaUrl) return '';

  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl) } as any,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Failed to decrypt URL:', err);
    return '';
  }
};
