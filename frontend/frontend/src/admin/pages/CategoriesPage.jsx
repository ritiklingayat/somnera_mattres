import { useEffect, useState } from 'react';
import AdminModal from '../components/AdminModal';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import {
  addAdminCategoryApi,
  deleteAdminCategoryApi,
  getAdminCategoriesApi,
  updateAdminCategoryApi,
} from '../services/adminCategoryService';

function CategoryForm({ category, onSave, onClose }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [subcategories, setSubcategories] = useState(category?.subcategories || []);
  const [newSubInput, setNewSubInput] = useState('');
  const [isActive, setIsActive] = useState(category?.isActive !== false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.imageUrl || category?.image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addSubcategory = () => {
    const trimmed = newSubInput.trim();
    if (!trimmed) return;
    if (subcategories.some((sub) => sub.toLowerCase() === trimmed.toLowerCase())) {
      setError('This subcategory already exists.');
      return;
    }
    setSubcategories((current) => [...current, trimmed]);
    setNewSubInput('');
    setError('');
  };

  const handleSubInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSubcategory();
    }
  };

  const removeSubcategory = (indexToRemove) => {
    setSubcategories((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError('Category name must contain at least 2 characters.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        id: category?.id,
        name: trimmedName,
        description: description.trim(),
        subcategories,
        isActive,
        imageFile,
        imageUrl: imagePreview && !imageFile ? imagePreview : undefined,
      });
    } catch (err) {
      setError(err.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="category-form admin-form-stack" onSubmit={handleSubmit}>
      <label>
        Category Name *
        <input
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Orthopaedic Mattresses"
          disabled={saving}
        />
      </label>

      <label>
        Description
        <textarea
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short overview of this category collection"
          disabled={saving}
        />
      </label>

      <label>
        Category Image (Cloudinary)
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={saving}
        />
      </label>
      {imagePreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
          <img
            src={imagePreview}
            alt="Preview"
            style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--admin-line)' }}
          />
          <button
            type="button"
            className="chip-remove"
            style={{ fontSize: '0.85rem' }}
            onClick={() => {
              setImageFile(null);
              setImagePreview('');
            }}
          >
            Remove image
          </button>
        </div>
      )}

      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={saving}
          />
          Active on Storefront
        </label>
      </div>

      <div className="subcategories-manager">
        <label>Sub Categories</label>
        <div className="subcategory-input-row">
          <input
            value={newSubInput}
            onChange={(event) => setNewSubInput(event.target.value)}
            onKeyDown={handleSubInputKeyDown}
            placeholder="Type a sub category (e.g. Firm Support)"
            disabled={saving}
          />
          <button
            type="button"
            className="admin-action subcategory-add-btn"
            onClick={addSubcategory}
            disabled={saving}
          >
            + Sub Category
          </button>
        </div>

        <div className="subcategory-tags-list">
          {subcategories.length > 0 ? (
            subcategories.map((sub, index) => (
              <span key={`${sub}-${index}`} className="subcategory-chip">
                {sub}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => removeSubcategory(index)}
                  title="Remove subcategory"
                  disabled={saving}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <small className="subcategory-empty-text">
              No subcategories added yet. Type above and click "+ Sub Category".
            </small>
          )}
        </div>
      </div>

      {error && (
        <p className="account-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="product-form-actions" style={{ marginTop: '20px' }}>
        <button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="admin-action" disabled={saving}>
          {saving ? (
            <LoadingSpinner label={category ? 'Updating Category...' : 'Adding Category...'} inline />
          ) : (
            'Save Category'
          )}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setPageError('');
      const data = await getAdminCategoriesApi();
      setCategories(data);
    } catch (error) {
      console.error('Unable to load admin categories:', error);
      setCategories([]);
      setPageError(error.message || 'Unable to load categories from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const close = () => {
    setIsOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (categoryData) => {
    if (editingCategory) {
      const updated = await updateAdminCategoryApi(editingCategory.id, categoryData);
      setCategories((current) =>
        current.map((cat) => (cat.id === updated.id ? updated : cat))
      );
    } else {
      const created = await addAdminCategoryApi(categoryData);
      setCategories((current) => [created, ...current]);
    }
    close();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this category?');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setPageError('');
      await deleteAdminCategoryApi(id);
      setCategories((current) => current.filter((cat) => cat.id !== id));
    } catch (error) {
      setPageError(error.message || 'Unable to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <p>Catalog</p>
          <h1>Categories</h1>
        </div>
        <button className="admin-action" onClick={() => setIsOpen(true)}>
          + Add Category
        </button>
      </div>

      <section className="admin-card category-admin">
        {pageError && (
          <p className="account-form-error" role="alert">
            {pageError}
          </p>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <LoadingSpinner label="Loading Categories from PostgreSQL..." />
          </div>
        ) : categories.length > 0 ? (
          <div className="order-table category-table">
            <header className="table-head category-table-head" style={{ gridTemplateColumns: '80px 1.5fr 2fr 100px 140px' }}>
              <span>Image</span>
              <span>Category Name</span>
              <span>Sub Categories</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </header>

            {categories.map((category) => (
              <article
                key={category.id}
                className="table-row category-table-row"
                style={{ gridTemplateColumns: '80px 1.5fr 2fr 100px 140px', alignItems: 'center' }}
              >
                <div>
                  {category.imageUrl || category.image ? (
                    <img
                      src={category.imageUrl || category.image}
                      alt={category.name}
                      style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--admin-line)' }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '40px', background: '#f5efe8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: '#999', fontSize: '0.7rem' }}>
                      No img
                    </div>
                  )}
                </div>

                <div className="category-name-cell">
                  <b>{category.name}</b>
                  {category.description && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                      {category.description}
                    </p>
                  )}
                  <small className="subcategory-count">
                    {category.subcategories?.length || 0} Subcategories
                  </small>
                </div>

                <div className="category-subcategories-cell">
                  {category.subcategories?.length > 0 ? (
                    category.subcategories.map((sub, index) => (
                      <span className="subcategory-pill" key={`${category.id}-${sub}-${index}`}>
                        {sub}
                      </span>
                    ))
                  ) : (
                    <small className="no-subcategories">No subcategories</small>
                  )}
                </div>

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      background: category.isActive !== false ? '#e8f5e9' : '#f5f5f5',
                      color: category.isActive !== false ? '#2e7d32' : '#757575',
                    }}
                  >
                    {category.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="row-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    className="edit-category"
                    onClick={() => {
                      setEditingCategory(category);
                      setIsOpen(true);
                    }}
                    disabled={deletingId === category.id}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deletingId === category.id}
                    style={{ color: '#d32f2f' }}
                  >
                    {deletingId === category.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="module-empty">
            <span>✦</span>
            <h2>No categories found</h2>
            <p>Click the button below to add your first category with Cloudinary image and subcategories.</p>
            <button onClick={() => setIsOpen(true)} className="admin-action">
              + Add Category
            </button>
          </div>
        )}
      </section>

      {isOpen && (
        <AdminModal
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          isOpen={isOpen}
          onClose={close}
        >
          <CategoryForm
            category={editingCategory}
            onSave={handleSave}
            onClose={close}
          />
        </AdminModal>
      )}
    </>
  );
}
