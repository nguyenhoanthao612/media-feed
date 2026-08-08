import { MediaItem } from '@/types/media';

export const GOOGLE_APPS_SCRIPT_CODE = `// ==========================================
// GOOGLE APPS SCRIPT FOR MY MEDIA FEED DB
// Hướng dẫn:
// 1. Vào Google Sheets (sheets.google.com) tạo bảng tính mới.
// 2. Chọn Tiện ích mở rộng (Extensions) -> Apps Script.
// 3. Xóa code cũ, dán toàn bộ đoạn mã bên dưới vào.
// 4. Bấm Lưu (Save - biểu tượng đĩa tròn) -> Bấm Triển khai (Deploy) -> Triển khai mới (New deployment).
// 5. Chọn loại "Ứng dụng web" (Web app), mục "Ai có quyền truy cập" chọn "Bất kỳ ai" (Anyone).
// 6. Bấm Triển khai, cấp quyền truy cập nếu được hỏi, rồi sao chép URL Ứng dụng Web dán vào App!
// ==========================================

function doGet(e) {
  var sheet = getOrCreateSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return respondJSON({ success: true, items: [] });
  }
  
  var headers = rows[0];
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      if (key === 'tags') {
        try {
          item[key] = typeof val === 'string' ? JSON.parse(val) : val;
        } catch(err) {
          item[key] = val ? val.toString().split(',') : [];
        }
      } else if (key === 'favorite') {
        item[key] = val === true || val === 'TRUE' || val === 'true';
      } else if (key === 'createdAt') {
        item[key] = Number(val) || Date.now();
      } else {
        item[key] = val ? val.toString() : '';
      }
    }
    if (item.id) items.push(item);
  }
  return respondJSON({ success: true, items: items });
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action || 'sync_all';
    var sheet = getOrCreateSheet();
    
    if (action === 'sync_all' || action === 'save_all') {
      var items = contents.items || [];
      sheet.clearContents();
      var headers = ['id', 'title', 'description', 'type', 'sourceUrl', 'thumbnailUrl', 'audioUrl', 'previewUrl', 'tags', 'collectionId', 'favorite', 'createdAt'];
      sheet.appendRow(headers);
      
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        sheet.appendRow([
          it.id || '',
          it.title || '',
          it.description || '',
          it.type || 'video',
          it.sourceUrl || '',
          it.thumbnailUrl || '',
          it.audioUrl || '',
          it.previewUrl || '',
          JSON.stringify(it.tags || []),
          it.collectionId || '',
          it.favorite ? true : false,
          it.createdAt || Date.now()
        ]);
      }
      return respondJSON({ success: true, count: items.length });
    } else if (action === 'add') {
      var it = contents.item;
      if (it && it.id) {
        sheet.appendRow([
          it.id || '',
          it.title || '',
          it.description || '',
          it.type || 'video',
          it.sourceUrl || '',
          it.thumbnailUrl || '',
          it.audioUrl || '',
          it.previewUrl || '',
          JSON.stringify(it.tags || []),
          it.collectionId || '',
          it.favorite ? true : false,
          it.createdAt || Date.now()
        ]);
      }
      return respondJSON({ success: true });
    } else if (action === 'delete') {
      var targetId = contents.id;
      var rows = sheet.getDataRange().getValues();
      for (var r = rows.length - 1; r >= 1; r--) {
        if (rows[r][0] == targetId) {
          sheet.deleteRow(r + 1);
        }
      }
      return respondJSON({ success: true });
    }
    
    return respondJSON({ success: false, message: 'Action không hợp lệ' });
  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MediaFeedDB');
  if (!sheet) {
    sheet = ss.insertSheet('MediaFeedDB');
    sheet.appendRow(['id', 'title', 'description', 'type', 'sourceUrl', 'thumbnailUrl', 'audioUrl', 'previewUrl', 'tags', 'collectionId', 'favorite', 'createdAt']);
  }
  return sheet;
}

function respondJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

const LOCAL_STORAGE_WEBAPP_KEY = 'media_feed_google_sheets_webapp_url';
const LOCAL_STORAGE_AUTO_SYNC_KEY = 'media_feed_google_sheets_auto_sync';

export function getStoredSheetsWebAppUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LOCAL_STORAGE_WEBAPP_KEY) || '';
}

export function setStoredSheetsWebAppUrl(url: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_WEBAPP_KEY, url.trim());
}

export function getStoredAutoSync(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(LOCAL_STORAGE_AUTO_SYNC_KEY);
  return val !== null ? val === 'true' : true;
}

export function setStoredAutoSync(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_AUTO_SYNC_KEY, enabled ? 'true' : 'false');
}

/**
 * Fetch all media items from Google Sheets Web App
 */
export async function fetchItemsFromSheets(webAppUrl: string): Promise<MediaItem[]> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return [];
  try {
    const res = await fetch(webAppUrl, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        id: String(item.id),
        title: item.title || 'Untitled',
        description: item.description || '',
        type: item.type || 'video',
        sourceUrl: item.sourceUrl || undefined,
        thumbnailUrl: item.thumbnailUrl || undefined,
        audioUrl: item.audioUrl || undefined,
        previewUrl: item.previewUrl || undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
        collectionId: item.collectionId || undefined,
        favorite: Boolean(item.favorite),
        createdAt: Number(item.createdAt) || Date.now(),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw error;
  }
}

/**
 * Sync (Push) all items to Google Sheets
 */
export async function pushAllItemsToSheets(webAppUrl: string, items: MediaItem[]): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;
  try {
    const cleanItems = items.map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description || '',
      type: it.type,
      sourceUrl: it.sourceUrl || '',
      thumbnailUrl: it.thumbnailUrl || '',
      audioUrl: it.audioUrl || '',
      previewUrl: it.previewUrl || '',
      tags: it.tags || [],
      collectionId: it.collectionId || '',
      favorite: it.favorite || false,
      createdAt: it.createdAt || Date.now(),
    }));

    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight in Apps Script
      body: JSON.stringify({ action: 'sync_all', items: cleanItems }),
    });

    const data = await res.json();
    return Boolean(data.success);
  } catch (error) {
    console.error('Error pushing to Google Sheets:', error);
    return false;
  }
}

/**
 * Test connectivity with Google Apps Script Web App
 */
export async function testSheetsConnection(webAppUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'URL không hợp lệ. Vui lòng kiểm tra lại.' };
  }
  try {
    const res = await fetch(webAppUrl, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { success: false, message: `Lỗi kết nối HTTP (${res.status})` };
    const data = await res.json();
    if (data.success !== undefined) {
      return { success: true, message: 'Kết nối thành công tới Google Sheets Database!' };
    }
    return { success: false, message: 'Phản hồi từ Apps Script không đúng cấu trúc.' };
  } catch (err: any) {
    return { success: false, message: `Lỗi kết nối: ${err?.message || 'Không thể gọi API Apps Script'}` };
  }
}
