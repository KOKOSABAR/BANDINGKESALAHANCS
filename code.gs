/**
 * Google Apps Script (code.gs)
 * Sistem Sinkronisasi Data Banding Livechat ke Google Sheets
 * 
 * Script ini otomatis membuat Sheet, header, dropdown keterangan (Data Validation),
 * dan menangani penambahan, pengeditan, penghapusan, serta pengambilan data.
 */

// Nama Sheet untuk penyimpanan data
var SHEET_NAME = "Data Banding";
var STAFF_SHEET_NAME = "Daftar Staff";
var SITUS_SHEET_NAME = "Daftar Situs";

// Opsi untuk Dropdown Keterangan (Status)
var STATUS_OPTIONS = ["DONE", "PENDING", "BANDING DI TOLAK", "NOTE"];

// Daftar Staff default untuk inisialisasi awal
var DEFAULT_STAFF_PRESETS = [
  "Andi Saputra",
  "Siti Rahma",
  "Budi Santoso",
  "Hendra Wijaya",
  "Dewi Lestari",
  "Rian Hidayat",
  "Mega Utami"
];

// Daftar Situs default untuk inisialisasi awal
var DEFAULT_SITUS_PRESETS = [
  "WDBOS"
];

/**
 * Fungsi inisialisasi awal. Membuat Sheet, mengatur Header, styling, dan dropdown.
 */
function initializeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Inisialisasi Sheet Data Banding
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Setup Headers
  var headers = [
    "ID",                         // Kolom A
    "TANGGAL",                    // Kolom B
    "NAMA SITUS",                 // Kolom C
    "NAMA STAFF",                 // Kolom D
    "BUKTI SS AUDITOR",           // Kolom E (kumpulan link dipisah koma)
    "BUKTI BANDING",              // Kolom F (kumpulan link dipisah koma)
    "KETERANGAN BANDING",         // Kolom G
    "KETERANGAN (STATUS)",        // Kolom H (Dropdown)
    "KETERANGAN DI TOLAK / NOTE",  // Kolom I
    "TERAKHIR DIPERBARUI"         // Kolom J
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Styling Header agar terlihat profesional & jelas
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setFontColor("#ffffff");
  headerRange.setBackgroundColor("#1e293b"); // Slate 800
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  
  // Freeze baris pertama agar header tetap terlihat saat scroll
  sheet.setFrozenRows(1);
  
  // Atur lebar kolom default agar rapi dan tidak terpotong
  sheet.setColumnWidth(1, 130); // ID
  sheet.setColumnWidth(2, 100); // Tanggal
  sheet.setColumnWidth(3, 110); // Nama Situs
  sheet.setColumnWidth(4, 150); // Nama Staff
  sheet.setColumnWidth(5, 200); // Bukti SS Auditor
  sheet.setColumnWidth(6, 200); // Bukti Banding
  sheet.setColumnWidth(7, 280); // Keterangan Banding
  sheet.setColumnWidth(8, 160); // Keterangan (Dropdown)
  sheet.setColumnWidth(9, 250); // Keterangan Di Tolak / Note
  sheet.setColumnWidth(10, 150); // Terakhir Diperbarui
  
  // Set Word Wrap untuk kolom teks panjang agar rapi
  sheet.getRange("E:I").setWrap(true);
  
  // Set Dropdown Data Validation untuk kolom H (Keterangan/Status)
  // Berlaku untuk baris ke-2 hingga baris ke-5000
  var dropdownRange = sheet.getRange("H2:H5000");
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .setHelpText("Silakan pilih status: DONE, PENDING, BANDING DI TOLAK, atau NOTE")
    .build();
  dropdownRange.setDataValidation(rule);
  
  // Format Tanggal untuk kolom B
  sheet.getRange("B2:B5000").setNumberFormat("YYYY-MM-DD");
  
  // 2. Inisialisasi Sheet Daftar Staff
  var staffSheet = ss.getSheetByName(STAFF_SHEET_NAME);
  if (!staffSheet) {
    staffSheet = ss.insertSheet(STAFF_SHEET_NAME);
    staffSheet.getRange(1, 1).setValue("NAMA STAFF");
    
    // Style header staff sheet
    var staffHeader = staffSheet.getRange(1, 1);
    staffHeader.setFontWeight("bold");
    staffHeader.setFontColor("#ffffff");
    staffHeader.setBackgroundColor("#475569"); // Slate 600
    staffHeader.setHorizontalAlignment("center");
    staffSheet.setColumnWidth(1, 200);
    
    // Prepopulate dengan Default Presets
    for (var k = 0; k < DEFAULT_STAFF_PRESETS.length; k++) {
      staffSheet.appendRow([DEFAULT_STAFF_PRESETS[k]]);
    }
  }
  
  // 3. Inisialisasi Sheet Daftar Situs
  var situsSheet = ss.getSheetByName(SITUS_SHEET_NAME);
  if (!situsSheet) {
    situsSheet = ss.insertSheet(SITUS_SHEET_NAME);
    situsSheet.getRange(1, 1).setValue("NAMA SITUS");
    
    // Style header situs sheet
    var situsHeader = situsSheet.getRange(1, 1);
    situsHeader.setFontWeight("bold");
    situsHeader.setFontColor("#ffffff");
    situsHeader.setBackgroundColor("#475569"); // Slate 600
    situsHeader.setHorizontalAlignment("center");
    situsSheet.setColumnWidth(1, 200);
    
    // Prepopulate dengan Default Presets
    for (var m = 0; m < DEFAULT_SITUS_PRESETS.length; m++) {
      situsSheet.appendRow([DEFAULT_SITUS_PRESETS[m]]);
    }
  }
  
  return sheet;
}

/**
 * GET Request Handler - Mengambil seluruh data dari Google Sheet ke aplikasi React
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ambil daftar staff dari sheet "Daftar Staff"
    var staffSheet = ss.getSheetByName(STAFF_SHEET_NAME);
    if (!staffSheet) {
      initializeSheet();
      staffSheet = ss.getSheetByName(STAFF_SHEET_NAME);
    }
    
    var staffData = staffSheet.getDataRange().getValues();
    var staffList = [];
    for (var k = 1; k < staffData.length; k++) {
      if (staffData[k][0]) {
        staffList.push(staffData[k][0].toString().trim());
      }
    }

    // Ambil daftar situs dari sheet "Daftar Situs"
    var situsSheet = ss.getSheetByName(SITUS_SHEET_NAME);
    if (!situsSheet) {
      initializeSheet();
      situsSheet = ss.getSheetByName(SITUS_SHEET_NAME);
    }
    
    var situsData = situsSheet.getDataRange().getValues();
    var situsList = [];
    for (var m = 1; m < situsData.length; m++) {
      if (situsData[m][0]) {
        situsList.push(situsData[m][0].toString().trim());
      }
    }
    
    // Jika request khusus untuk daftar staff saja
    if (e && e.parameter && e.parameter.type === "staff") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", staffList: staffList }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // Jika request khusus untuk daftar situs saja
    if (e && e.parameter && e.parameter.type === "situs") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", situsList: situsList }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = initializeSheet();
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var list = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // Lewati jika ID kosong
      
      // Parse link SS Auditor (dipisah koma)
      var ssAuditor = [];
      if (row[4]) {
        ssAuditor = row[4].toString().split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      }
      
      // Parse link bukti banding (dipisah koma)
      var bBanding = [];
      if (row[5]) {
        bBanding = row[5].toString().split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      }
      
      list.push({
        id: row[0].toString(),
        tanggal: row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), "yyyy-MM-dd") : row[1].toString(),
        namaSitus: row[2].toString(),
        namaStaff: row[3].toString(),
        buktiSSAuditor: ssAuditor,
        buktiBanding: bBanding,
        keteranganBanding: row[6].toString(),
        keterangan: row[7].toString(),
        keteranganBandingDiTolak: row[8].toString(),
        updatedAt: row[9] ? row[9].toString() : ""
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: list, staffList: staffList, situsList: situsList }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST Request Handler - Menerima perintah penambahan, pembaruan, penghapusan, atau sinkronisasi massal
 */
function doPost(e) {
  // Dukungan CORS Preflight manual
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action; // 'create', 'update', 'delete', 'sync_all'
    var item = payload.data;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = initializeSheet();
    }
    
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    if (action === "create") {
      // 1. Tambah data baru ke baris paling bawah
      var ssAuditorStr = Array.isArray(item.buktiSSAuditor) ? item.buktiSSAuditor.join(", ") : "";
      var bBandingStr = Array.isArray(item.buktiBanding) ? item.buktiBanding.join(", ") : "";
      
      sheet.appendRow([
        item.id,
        item.tanggal,
        item.namaSitus,
        item.namaStaff,
        ssAuditorStr,
        bBandingStr,
        item.keteranganBanding,
        item.keterangan,
        item.keteranganBandingDiTolak || "",
        timestamp
      ]);
      
      // Berikan style background baris baru sesuai status keterangannya
      styleRowByStatus(sheet, sheet.getLastRow(), item.keterangan);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil ditambahkan ke Google Sheets" }))
                           .setMimeType(ContentService.MimeType.JSON);
    } 
    
    else if (action === "update") {
      // 2. Cari baris berdasarkan ID lalu perbarui
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === item.id.toString()) {
          foundRow = i + 1; // Row index is 1-based
          break;
        }
      }
      
      if (foundRow !== -1) {
        var ssAuditorStr = Array.isArray(item.buktiSSAuditor) ? item.buktiSSAuditor.join(", ") : "";
        var bBandingStr = Array.isArray(item.buktiBanding) ? item.buktiBanding.join(", ") : "";
        
        // Update range kolom B s.d J (kolom 2 s.d 10)
        sheet.getRange(foundRow, 2, 1, 9).setValues([[
          item.tanggal,
          item.namaSitus,
          item.namaStaff,
          ssAuditorStr,
          bBandingStr,
          item.keteranganBanding,
          item.keterangan,
          item.keteranganBandingDiTolak || "",
          timestamp
        ]]);
        
        // Update warna baris
        styleRowByStatus(sheet, foundRow, item.keterangan);
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil diperbarui di Google Sheets" }))
                             .setMimeType(ContentService.MimeType.JSON);
      } else {
        // Jika ID tidak ditemukan, buat baris baru saja (auto-recovery)
        var ssAuditorStr = Array.isArray(item.buktiSSAuditor) ? item.buktiSSAuditor.join(", ") : "";
        var bBandingStr = Array.isArray(item.buktiBanding) ? item.buktiBanding.join(", ") : "";
        sheet.appendRow([
          item.id,
          item.tanggal,
          item.namaSitus,
          item.namaStaff,
          ssAuditorStr,
          bBandingStr,
          item.keteranganBanding,
          item.keterangan,
          item.keteranganBandingDiTolak || "",
          timestamp
        ]);
        styleRowByStatus(sheet, sheet.getLastRow(), item.keterangan);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data ID tidak ditemukan, otomatis membuat baris baru" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
    } 
    
    else if (action === "delete") {
      // 3. Hapus baris berdasarkan ID
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === item.id.toString()) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.deleteRow(foundRow);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil dihapus dari Google Sheets" }))
                             .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ID tidak ditemukan untuk dihapus" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    else if (action === "sync_all") {
      // 4. Sinkronisasi Massal (Timpa seluruh data saat ini dari local storage ke sheet)
      var itemsArray = payload.items;
      if (!Array.isArray(itemsArray)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Format array items salah" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Kosongkan seluruh baris di bawah header
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      // Tambahkan kembali satu per satu
      for (var j = 0; j < itemsArray.length; j++) {
        var it = itemsArray[j];
        var ssAuditorStr = Array.isArray(it.buktiSSAuditor) ? it.buktiSSAuditor.join(", ") : "";
        var bBandingStr = Array.isArray(it.buktiBanding) ? it.buktiBanding.join(", ") : "";
        
        sheet.appendRow([
          it.id,
          it.tanggal,
          it.namaSitus,
          it.namaStaff,
          ssAuditorStr,
          bBandingStr,
          it.keteranganBanding,
          it.keterangan,
          it.keteranganBandingDiTolak || "",
          timestamp
        ]);
        
        styleRowByStatus(sheet, sheet.getLastRow(), it.keterangan);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sinkronisasi massal berhasil (" + itemsArray.length + " entri)" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "add_staff") {
      var staffName = payload.staffName;
      if (!staffName) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nama staff tidak boleh kosong" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      var staffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STAFF_SHEET_NAME);
      if (!staffSheet) {
        initializeSheet();
        staffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STAFF_SHEET_NAME);
      }
      
      // Cek apakah sudah ada
      var staffData = staffSheet.getDataRange().getValues();
      var exists = false;
      for (var k = 1; k < staffData.length; k++) {
        if (staffData[k][0].toString().toLowerCase() === staffName.toLowerCase()) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        staffSheet.appendRow([staffName]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Nama staff '" + staffName + "' berhasil ditambahkan ke Google Sheets" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "delete_staff") {
      var staffName = payload.staffName;
      if (!staffName) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nama staff tidak boleh kosong" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      var staffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STAFF_SHEET_NAME);
      if (staffSheet) {
        var staffData = staffSheet.getDataRange().getValues();
        var found = false;
        for (var k = 1; k < staffData.length; k++) {
          if (staffData[k][0].toString().toLowerCase() === staffName.toLowerCase()) {
            staffSheet.deleteRow(k + 1);
            found = true;
            break;
          }
        }
        if (found) {
          return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Nama staff '" + staffName + "' berhasil dihapus dari Google Sheets" }))
                               .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nama staff tidak ditemukan di Google Sheets" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "sync_staff_all") {
      var staffListArray = payload.staffList;
      if (!Array.isArray(staffListArray)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Format array staffList salah" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      var staffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STAFF_SHEET_NAME);
      if (!staffSheet) {
        initializeSheet();
        staffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STAFF_SHEET_NAME);
      }
      
      // Kosongkan staff list (kecuali header)
      var lastRow = staffSheet.getLastRow();
      if (lastRow > 1) {
        staffSheet.deleteRows(2, lastRow - 1);
      }
      
      // Tambah kembali satu per satu
      for (var k = 0; k < staffListArray.length; k++) {
        var name = staffListArray[k];
        if (name && name.trim()) {
          staffSheet.appendRow([name.trim()]);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sinkronisasi seluruh nama staff berhasil" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "add_situs") {
      var situsName = payload.situsName;
      if (!situsName) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nama situs tidak boleh kosong" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      var situsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITUS_SHEET_NAME);
      if (!situsSheet) {
        initializeSheet();
        situsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITUS_SHEET_NAME);
      }
      
      // Cek apakah sudah ada
      var situsData = situsSheet.getDataRange().getValues();
      var exists = false;
      for (var k = 1; k < situsData.length; k++) {
        if (situsData[k][0].toString().toLowerCase() === situsName.toLowerCase()) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        situsSheet.appendRow([situsName]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Nama situs '" + situsName + "' berhasil ditambahkan ke Google Sheets" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "delete_situs") {
      var situsName = payload.situsName;
      if (!situsName) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nama situs tidak boleh kosong" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      var situsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITUS_SHEET_NAME);
      if (situsSheet) {
        var situsData = situsSheet.getDataRange().getValues();
        var found = false;
        for (var k = 1; k < situsData.length; k++) {
          if (situsData[k][0].toString().toLowerCase() === situsName.toLowerCase()) {
            situsSheet.deleteRow(k + 1);
            found = true;
            break;
          }
        }
        if (found) {
          return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Nama situs '" + situsName + "' berhasil dihapus dari Google Sheets" }))
                               .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nama situs tidak ditemukan di Google Sheets" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "sync_situs_all") {
      var situsListArray = payload.situsList;
      if (!Array.isArray(situsListArray)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Format array situsList salah" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      var situsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITUS_SHEET_NAME);
      if (!situsSheet) {
        initializeSheet();
        situsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SITUS_SHEET_NAME);
      }
      
      // Kosongkan situs list (kecuali header)
      var lastRow = situsSheet.getLastRow();
      if (lastRow > 1) {
        situsSheet.deleteRows(2, lastRow - 1);
      }
      
      // Tambah kembali satu per satu
      for (var k = 0; k < situsListArray.length; k++) {
        var name = situsListArray[k];
        if (name && name.trim()) {
          situsSheet.appendRow([name.trim()]);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sinkronisasi seluruh nama situs berhasil" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action tidak dikenal" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fungsi pembantu untuk memberi warna background pada baris sesuai dengan status keterangan (KeteranganStatus)
 * done: Hijau pastel, pending: Kuning pastel, banding di tolak: Merah pastel, note: Biru pastel
 */
function styleRowByStatus(sheet, rowIndex, status) {
  var range = sheet.getRange(rowIndex, 1, 1, 10);
  
  switch (status) {
    case "DONE":
      range.setBackground("#ecfdf5"); // emerald-50
      break;
    case "PENDING":
      range.setBackground("#fef3c7"); // amber-100
      break;
    case "BANDING DI TOLAK":
      range.setBackground("#ffe4e6"); // rose-100
      break;
    case "NOTE":
      range.setBackground("#f0f9ff"); // sky-50
      break;
    default:
      range.setBackground("#ffffff"); // Putih bersih
  }
}
