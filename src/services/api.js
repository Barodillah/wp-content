import { getAppBasename, getDownloadUrl, getBulkDownloadUrl } from '../utils/basename';

const API_BASE = '/wp_api/api.php';
const UPLOAD_BASE = '/wp_api/upload.php';

function resolveUrl(url) {
  if (typeof url === 'string' && url.startsWith('/wp_api')) {
    const base = getAppBasename();
    return `${base}${url}`;
  }
  return url;
}

async function request(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  };

  const response = await fetch(resolveUrl(url), { ...defaultOptions, ...options });
  
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Sesi telah berakhir atau belum masuk.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || (data.errors ? data.errors.join(', ') : 'Terjadi kesalahan sistem.'));
  }

  return data;
}

export const api = {
  // Auth
  async login(username, password) {
    return request(`${API_BASE}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async logout() {
    return request(`${API_BASE}?action=logout`, { method: 'POST' });
  },

  async me() {
    return request(`${API_BASE}?action=me`);
  },

  // Folders & Assets
  async list(folderId = null) {
    const query = folderId ? `&folder_id=${folderId}` : '';
    return request(`${API_BASE}?action=list${query}`);
  },

  async search(query) {
    return request(`${API_BASE}?action=search&q=${encodeURIComponent(query)}`);
  },

  async createFolder(name, parentId = null) {
    return request(`${API_BASE}?action=create_folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent_id: parentId })
    });
  },

  async renameFolder(id, newName) {
    return request(`${API_BASE}?action=rename_folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, new_name: newName })
    });
  },

  async deleteFolder(id) {
    return request(`${API_BASE}?action=delete_folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  async getAllFolders() {
    return request(`${API_BASE}?action=get_all_folders`);
  },

  async moveAsset(id, folderId) {
    return request(`${API_BASE}?action=move_asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, folder_id: folderId })
    });
  },

  async renameAsset(id, newName) {
    return request(`${API_BASE}?action=rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, new_name: newName })
    });
  },

  async deleteAsset(id) {
    return request(`${API_BASE}?action=delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  // Bulk Operations
  async bulkMove(ids, folderId) {
    return request(`${API_BASE}?action=bulk_move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, folder_id: folderId })
    });
  },

  async bulkRename(payload) {
    let body = {};
    if (Array.isArray(payload)) {
      body = { items: payload };
    } else if (payload && typeof payload === 'object') {
      body = payload;
    }
    return request(`${API_BASE}?action=bulk_rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },

  async bulkDelete(ids) {
    return request(`${API_BASE}?action=bulk_delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
  },

  // Upload
  async uploadFiles(files, folderId = null) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i]);
    }
    if (folderId) formData.append('folder_id', folderId);

    const response = await fetch(resolveUrl(UPLOAD_BASE), {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.errors ? data.errors.join(', ') : 'Gagal mengunggah file.');
    }
    return data;
  },

  async uploadUrl(url, folderId = null) {
    const formData = new FormData();
    formData.append('asset_url', url);
    if (folderId) formData.append('folder_id', folderId);

    const response = await fetch(resolveUrl(UPLOAD_BASE), {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.errors ? data.errors.join(', ') : 'Gagal menarik asset dari URL.');
    }
    return data;
  },

  // User Management (Superuser)
  async getUsers() {
    return request(`${API_BASE}?action=get_users`);
  },

  async createUser(userData) {
    return request(`${API_BASE}?action=create_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  async updateUser(userData) {
    return request(`${API_BASE}?action=update_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(id) {
    return request(`${API_BASE}?action=delete_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  async updateProfile(profileData) {
    return request(`${API_BASE}?action=update_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
  },

  async checkAssetUsage(id, ids = null) {
    const query = ids ? `&ids=${ids.join(',')}` : `&id=${id}`;
    return request(`${API_BASE}?action=check_asset_usage${query}`);
  },

  async trackAccess(assetId, fileName = null) {
    const query = assetId ? `&asset_id=${assetId}` : `&file_name=${encodeURIComponent(fileName)}`;
    return request(`${API_BASE}?action=track_access${query}`);
  },

  async getSettings() {
    return request(`${API_BASE}?action=get_settings`);
  },

  async updateSettings(settingsData) {
    return request(`${API_BASE}?action=update_settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
  },

  getDownloadUrl(id) {
    return getDownloadUrl(id);
  },

  getBulkDownloadUrl(ids) {
    return getBulkDownloadUrl(ids);
  }
};
