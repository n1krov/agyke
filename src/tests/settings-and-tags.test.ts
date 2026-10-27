import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserDisplayName,
  validateAndSanitizeAlias,
  validateAndSanitizeTagInput,
  buildUserProfileSummaries,
  isValidTagColor,
} from '../services/settings-logic';
import type { User, Transaction } from '../types/database';

describe('Settings, Profiles, Aliases & Tags Logic (Fase 13)', () => {
  describe('getUserDisplayName', () => {
    it('returns alias when present and non-empty', () => {
      assert.equal(
        getUserDisplayName({ name: 'Lautaro Temperini', alias: 'Lau' }),
        'Lau'
      );
      assert.equal(
        getUserDisplayName({ name: 'Lautaro Temperini', alias: '  Capi  ' }),
        'Capi'
      );
    });

    it('falls back to original Telegram name when alias is null, undefined or whitespace', () => {
      assert.equal(
        getUserDisplayName({ name: 'Lautaro', alias: null }),
        'Lautaro'
      );
      assert.equal(
        getUserDisplayName({ name: 'Lautaro', alias: undefined }),
        'Lautaro'
      );
      assert.equal(
        getUserDisplayName({ name: 'Lautaro', alias: '   ' }),
        'Lautaro'
      );
    });

    it('returns fallback when user is null or undefined', () => {
      assert.equal(getUserDisplayName(null, 'Invitado'), 'Invitado');
      assert.equal(getUserDisplayName(undefined), 'Usuario');
    });
  });

  describe('validateAndSanitizeAlias', () => {
    it('accepts valid aliases up to 24 characters and trims whitespace', () => {
      const res = validateAndSanitizeAlias('  Gorda  ');
      assert.equal(res.valid, true);
      assert.equal(res.value, 'Gorda');
    });

    it('normalizes empty string or null to null (restoring original name)', () => {
      assert.deepEqual(validateAndSanitizeAlias(''), {
        valid: true,
        value: null,
      });
      assert.deepEqual(validateAndSanitizeAlias('   '), {
        valid: true,
        value: null,
      });
      assert.deepEqual(validateAndSanitizeAlias(null), {
        valid: true,
        value: null,
      });
    });

    it('rejects aliases exceeding 24 characters or non-string values', () => {
      const tooLong = validateAndSanitizeAlias('A'.repeat(25));
      assert.equal(tooLong.valid, false);
      assert.ok(tooLong.error?.includes('24'));

      const invalidType = validateAndSanitizeAlias(12345);
      assert.equal(invalidType.valid, false);
    });
  });

  describe('validateAndSanitizeTagInput & isValidTagColor', () => {
    it('validates and trims valid tag name and semantic color', () => {
      const res = validateAndSanitizeTagInput({
        name: '  Supermercado  ',
        color: 'emerald',
      });
      assert.equal(res.valid, true);
      assert.deepEqual(res.value, {
        name: 'Supermercado',
        color: 'emerald',
      });
    });

    it('defaults color to slate when omitted', () => {
      const res = validateAndSanitizeTagInput({ name: 'Hogar' });
      assert.equal(res.valid, true);
      assert.equal(res.value?.color, 'slate');
    });

    it('rejects empty tag names, names > 28 chars, or invalid colors', () => {
      assert.equal(validateAndSanitizeTagInput({ name: '   ' }).valid, false);
      assert.equal(
        validateAndSanitizeTagInput({ name: 'X'.repeat(29) }).valid,
        false
      );
      assert.equal(
        validateAndSanitizeTagInput({ name: 'Salidas', color: 'neon-pink' })
          .valid,
        false
      );
      assert.equal(isValidTagColor('indigo'), true);
      assert.equal(isValidTagColor('invalid'), false);
    });
  });

  describe('buildUserProfileSummaries', () => {
    const users: User[] = [
      {
        id: 'u-1',
        telegram_id: 1001,
        name: 'Lautaro',
        alias: 'Lau',
        created_at: '2026-07-01T10:00:00Z',
      },
      {
        id: 'u-2',
        telegram_id: 1002,
        name: 'Camila',
        alias: null,
        created_at: '2026-07-02T10:00:00Z',
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 'tx-old',
        user_id: 'u-1',
        amount: 12000,
        concept: 'Verdulería',
        classification: '50',
        debt_impact: 6000,
        created_at: '2026-10-10T12:00:00Z',
      },
      {
        id: 'tx-latest',
        user_id: 'u-1',
        amount: 45000,
        concept: 'Supermercado Coto',
        classification: '50',
        debt_impact: 22500,
        created_at: '2026-10-25T19:30:00Z',
      },
    ];

    it('computes display_name, transactions_count and picks latest transaction as last_activity', () => {
      const summaries = buildUserProfileSummaries(users, transactions);
      assert.equal(summaries.length, 2);

      const u1 = summaries[0];
      assert.equal(u1.display_name, 'Lau');
      assert.equal(u1.transactions_count, 2);
      assert.notEqual(u1.last_activity, null);
      assert.equal(u1.last_activity?.transaction_id, 'tx-latest');
      assert.equal(u1.last_activity?.amount, 45000);
      assert.equal(u1.last_activity?.concept, 'Supermercado Coto');

      const u2 = summaries[1];
      assert.equal(u2.display_name, 'Camila');
      assert.equal(u2.transactions_count, 0);
      assert.equal(u2.last_activity, null);
    });
  });
});
