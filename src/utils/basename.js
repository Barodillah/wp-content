// Utilitas untuk mendeteksi subfolder / sub-path tempat aplikasi di-deploy secara dinamis
export function getAppBasename() {
  if (typeof window === 'undefined') return '';
  let pathname = window.location.pathname;

  // Hapus trailing slash
  pathname = pathname.replace(/\/+$/, '');

  // Buang suffix route yang dikenal agar mendapatkan base path folder
  pathname = pathname.replace(/\/folder\/[^\/]+$/, '');
  pathname = pathname.replace(/\/login$/, '');

  return pathname; // e.g. "/wp", "/wp-content", atau "" jika di root
}

export function getApiBaseUrl() {
  const base = getAppBasename();
  return `${base}/wp_api/api.php`;
}

export function getUploadBaseUrl() {
  const base = getAppBasename();
  return `${base}/wp_api/upload.php`;
}

export function getDownloadUrl(id) {
  const base = getAppBasename();
  return `${base}/wp_api/api.php?action=download&id=${id}`;
}

export function getBulkDownloadUrl(ids) {
  const base = getAppBasename();
  return `${base}/wp_api/api.php?action=bulk_download&ids=${ids.join(',')}`;
}
