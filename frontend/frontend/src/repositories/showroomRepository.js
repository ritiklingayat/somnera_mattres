import {
  createId,
  deleteOne,
  getAll,
  getOne,
  initializeLocalDatabase,
  notifyCatalogChanged,
  putOne,
} from '../db/database';

function normalizeShowroom(showroom) {
  return {
    ...showroom,
    city: showroom.city.trim(),
    name: showroom.name.trim(),
    address: showroom.address.trim(),
    phone: showroom.phone.trim(),
    hours: showroom.hours.trim(),
    facilities: Array.isArray(showroom.facilities)
      ? showroom.facilities.map((facility) => facility.trim()).filter(Boolean)
      : [],
    mapUrl: showroom.mapUrl?.trim() || '',
    isActive: showroom.isActive !== false,
    sortOrder: Number.isInteger(Number(showroom.sortOrder))
      ? Number(showroom.sortOrder)
      : 0,
  };
}

export async function getShowrooms() {
  await initializeLocalDatabase();
  return (await getAll('showrooms')).sort(
    (left, right) =>
      Number(left.sortOrder || 0) - Number(right.sortOrder || 0) ||
      left.name.localeCompare(right.name),
  );
}

export async function addShowroom(showroom) {
  const now = new Date().toISOString();
  const record = {
    ...normalizeShowroom(showroom),
    id: showroom.id || createId('showroom'),
    createdAt: now,
    updatedAt: now,
  };
  await putOne('showrooms', record);
  notifyCatalogChanged();
  return record;
}

export async function updateShowroom(id, updates) {
  await initializeLocalDatabase();
  const current = await getOne('showrooms', id);
  if (!current) throw new Error('Showroom not found.');
  const record = {
    ...current,
    ...normalizeShowroom({ ...current, ...updates }),
    id: current.id,
    updatedAt: new Date().toISOString(),
  };
  await putOne('showrooms', record);
  notifyCatalogChanged();
  return record;
}

export async function deleteShowroom(id) {
  await initializeLocalDatabase();
  const current = await getOne('showrooms', id);
  if (current) await deleteOne('showrooms', current.id);
  notifyCatalogChanged();
}
