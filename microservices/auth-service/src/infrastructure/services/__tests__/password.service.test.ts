import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hash', () => {
    it('hashes the password using bcrypt', async () => {
      const password = 'Test1234!';
      const hash = await passwordService.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('produces different hashes for the same password', async () => {
      const password = 'Test1234!';

      const firstHash = await passwordService.hash(password);
      const secondHash = await passwordService.hash(password);

      expect(firstHash).not.toBe(secondHash);
    });
  });

  describe('compare', () => {
    it('returns true for a valid password', async () => {
      const password = 'Test1234!';
      const hash = await passwordService.hash(password);

      await expect(passwordService.compare(password, hash)).resolves.toBe(true);
    });

    it('returns false for an invalid password', async () => {
      const password = 'Test1234!';
      const hash = await passwordService.hash(password);

      await expect(passwordService.compare('WrongPassword', hash)).resolves.toBe(false);
    });
  });
});

