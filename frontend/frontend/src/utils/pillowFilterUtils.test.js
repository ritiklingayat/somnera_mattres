import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterAndSortPillows,
  getPillowFilterValues,
} from './pillowFilterUtils.js';


const products = [
  {
    id: 1,
    productType: 'PILLOW',
    isActive: true,
    material: 'Fiber',
    pillowType: 'Premium Pillow',
    price: 569,
    isFeatured: true,
  },
  {
    id: 2,
    productType: 'PILLOW',
    isActive: true,
    material: 'Memory Foam',
    pillowType: 'Cervical Pillow',
    price: 1499,
  },
  {
    id: 3,
    productType: 'PILLOW',
    isActive: true,
    material: 'Memory Foam',
    pillowType: 'Memory Foam Pillow',
    price: null,
  },
  {
    id: 4,
    productType: 'PILLOW',
    isActive: false,
    material: 'Latex',
    pillowType: 'Premium Pillow',
    price: 1999,
  },
  {
    id: 5,
    productType: 'PROTECTOR',
    isActive: true,
    material: 'Fiber',
    price: 700,
  },
];


test('derives filter values only from active Pillow products', () => {
  assert.deepEqual(
    getPillowFilterValues(products),
    {
      materials: ['Fiber', 'Memory Foam'],
      types: ['Cervical Pillow', 'Memory Foam Pillow', 'Premium Pillow'],
    },
  );
});


test('combines material, type, and price filters with AND logic', () => {
  const result = filterAndSortPillows(products, {
    selectedMaterials: ['Memory Foam'],
    selectedTypes: ['Cervical Pillow'],
    selectedPriceRange: '1000-1500',
  });

  assert.deepEqual(result.map((product) => product.id), [2]);
});


test('keeps null-price products when no price range is selected', () => {
  const result = filterAndSortPillows(products, {
    selectedMaterials: ['Memory Foam'],
  });

  assert.deepEqual(result.map((product) => product.id).sort(), [2, 3]);
});


test('excludes null-price products when a price range is selected', () => {
  const result = filterAndSortPillows(products, {
    selectedMaterials: ['Memory Foam'],
    selectedPriceRange: '1000-1500',
  });

  assert.deepEqual(result.map((product) => product.id), [2]);
});


test('sorts priced products low to high and leaves price-on-request last', () => {
  const result = filterAndSortPillows(products, {
    sortBy: 'price-low',
  });

  assert.deepEqual(result.map((product) => product.id), [1, 2, 3]);
});

