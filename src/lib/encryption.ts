// Simple client-side encryption for notes using Web Crypto API
// This provides basic privacy protection for offline storage

class EncryptionManager {
  private key: CryptoKey | null = null;
  private keyGenerated = false;

  async generateKey(userId: string): Promise<CryptoKey> {
    if (this.key && this.keyGenerated) {
      return this.key;
    }

    // Check if we have a stored key
    const storedKey = localStorage.getItem(`noteily_key_${userId}`);
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey);
        this.key = await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
        this.keyGenerated = true;
        return this.key;
      } catch (error) {
        console.error('Error importing stored key:', error);
        // Fall through to generate new key
      }
    }

    // Generate new key
    this.key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Store the key
    const exportedKey = await crypto.subtle.exportKey('jwk', this.key);
    localStorage.setItem(`noteily_key_${userId}`, JSON.stringify(exportedKey));
    this.keyGenerated = true;

    return this.key;
  }

  async encrypt(data: string, userId: string): Promise<string> {
    const key = await this.generateKey(userId);
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(data);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataArray
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encryptedData: string, userId: string): Promise<string> {
    try {
      const key = await this.generateKey(userId);
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return original if decryption fails (backwards compatibility)
    }
  }

  clearKey(userId: string): void {
    localStorage.removeItem(`noteily_key_${userId}`);
    this.key = null;
    this.keyGenerated = false;
  }
}

export const encryptionManager = new EncryptionManager();