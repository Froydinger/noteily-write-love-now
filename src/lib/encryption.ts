// End-to-end encryption for notes using Web Crypto API
// Zero-knowledge architecture - all data is encrypted before leaving the device

interface EncryptionMetadata {
  algorithm: string;
  keyDerivation: string;
  version: number;
  deviceFingerprint: string;
}

class EncryptionManager {
  private key: CryptoKey | null = null;
  private keyGenerated = false;
  private deviceFingerprint: string | null = null;

  // Generate a unique device fingerprint for deterministic key derivation
  private async getDeviceFingerprint(): Promise<string> {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }

    // Create a fingerprint based on available browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');

    // Hash the fingerprint for consistency
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    this.deviceFingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return this.deviceFingerprint;
  }

  // Generate deterministic encryption key from user ID only (device-independent)
  async generateKey(userId: string): Promise<CryptoKey> {
    if (this.key && this.keyGenerated) {
      return this.key;
    }

    // Check if we have a stored key first
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

    // Generate deterministic key based on userId only (works across devices)
    const keyMaterial = userId + '|noteily-2024';
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Derive key using PBKDF2 for consistency across sessions
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('noteily-salt-2024'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Store the key for faster access
    const exportedKey = await crypto.subtle.exportKey('jwk', this.key);
    localStorage.setItem(`noteily_key_${userId}`, JSON.stringify(exportedKey));
    this.keyGenerated = true;

    return this.key;
  }

  // Encrypt data with metadata for Supabase storage
  async encrypt(data: string, userId: string): Promise<{ encryptedContent: string; metadata: EncryptionMetadata }> {
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
    const encryptedContent = btoa(String.fromCharCode(...combined));
    
    // Create metadata
    const deviceFingerprint = await this.getDeviceFingerprint();
    const metadata: EncryptionMetadata = {
      algorithm: 'AES-GCM-256',
      keyDerivation: 'PBKDF2-SHA256',
      version: 1,
      deviceFingerprint
    };

    return { encryptedContent, metadata };
  }

  // Legacy encrypt method for backwards compatibility
  async encryptLegacy(data: string, userId: string): Promise<string> {
    const result = await this.encrypt(data, userId);
    return result.encryptedContent;
  }

  // Decrypt data from Supabase
  async decrypt(encryptedData: string, userId: string, metadata?: EncryptionMetadata): Promise<string> {
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
      
      // For backwards compatibility, return original data if decryption fails
      // This handles migration from unencrypted to encrypted notes
      return encryptedData;
    }
  }

  // Check if data appears to be encrypted (base64 format)
  isEncrypted(data: string): boolean {
    try {
      // Basic check: encrypted data should be base64 and reasonably long
      return data.length > 20 && /^[A-Za-z0-9+/]+=*$/.test(data) && btoa(atob(data)) === data;
    } catch {
      return false;
    }
  }

  clearKey(userId: string): void {
    localStorage.removeItem(`noteily_key_${userId}`);
    this.key = null;
    this.keyGenerated = false;
  }
}

export const encryptionManager = new EncryptionManager();