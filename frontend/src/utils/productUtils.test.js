import assert from 'node:assert/strict';
import test from 'node:test';
import { getAvailableThicknesses } from './productUtils.js';

test('getAvailableThicknesses: returns only thicknesses with valid positive prices', () => {
  const product = {
    name: 'Somnera Comfort',
    prices: {
      '4': 250,
      '5': '',
      '6': 0,
      '8': 350,
      pricePerSqFt: 75,
    },
  };

  const available = getAvailableThicknesses(product);
  assert.deepEqual(available, ['4', '8']);
});

test('getAvailableThicknesses: handles numeric keys and sorts numerically', () => {
  const product = {
    prices: {
      8: 300,
      4: 200,
      5: 250,
    },
  };

  const available = getAvailableThicknesses(product);
  assert.deepEqual(available, ['4', '5', '8']);
});

test('getAvailableThicknesses: returns empty array for null, undefined, or empty prices', () => {
  assert.deepEqual(getAvailableThicknesses(null), []);
  assert.deepEqual(getAvailableThicknesses({}), []);
  assert.deepEqual(getAvailableThicknesses({ prices: null }), []);
  assert.deepEqual(getAvailableThicknesses({ prices: {} }), []);
  assert.deepEqual(getAvailableThicknesses({ prices: { '4': 0, '5': null, '6': undefined, '8': '' } }), []);
  assert.deepEqual(getAvailableThicknesses({ prices: { pricePerSqFt: 75 } }), []);
});

test('getAvailableThicknesses: handles string rates and filters out negative / NaN values', () => {
  const product = {
    prices: {
      '4': '320',
      '5': '-10',
      '6': 'abc',
      '8': '400.50',
    },
  };

  const available = getAvailableThicknesses(product);
  assert.deepEqual(available, ['4', '8']);
});
