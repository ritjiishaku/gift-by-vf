// ═══════════════════════════════════════════════════════════════
//  Gifts by VF — Form → Sheet sync
//  Copies each Google Form submission into the correct tab.
//  Adds auto-fill (display_order, is_visible) and duplicate guards
//  so content lands reliably even with blank optional fields.
// ═══════════════════════════════════════════════════════════════

var TARGETS = [
  { tab: 'Sales Reps',    keys: ['commission_rate'] },
  { tab: 'Payouts',       keys: ['order_amount', 'commission'] },
  { tab: 'Testimonials',  keys: ['quote', 'rating'] },
  { tab: 'Portfolio',     keys: ['caption'] },
  { tab: 'Products',      keys: ['price', 'category'] },
  { tab: 'Why Us',        keys: ['icon'] },
  { tab: 'How to Order',  keys: ['title', 'description'] },
  { tab: 'FAQs',          keys: ['question', 'answer'] }
];

function onFormSubmit(e) {
  try {
    var row = {};

    // Preferred: map answers by their question title.
    if (e && e.namedValues) {
      for (var key in e.namedValues) {
        var v = e.namedValues[key];
        row[norm(key)] = String(v && v.length ? v[0] : '');
      }
    } else if (e && e.range && e.values) {
      var sheet = e.range.getSheet();
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      for (var i = 0; i < headers.length; i++) {
        row[norm(headers[i])] = e.values[i];
      }
    } else {
      return;
    }

    // Drop blank values so empty submissions are ignored.
    var filled = {};
    for (var key in row) {
      var val = String(row[key] == null ? '' : row[key]).trim();
      if (val !== '') filled[key] = val;
    }
    if (Object.keys(filled).length === 0) return;

    // Which tab does this form belong to?
    var target = null;
    for (var t = 0; t < TARGETS.length; t++) {
      var keys = TARGETS[t].keys;
      var ok = true;
      for (var k = 0; k < keys.length; k++) {
        if (!(norm(keys[k]) in filled)) { ok = false; break; }
      }
      if (ok) { target = TARGETS[t]; break; }
    }

    if (!target) {
      Logger.log('No matching tab. Headers found: ' + Object.keys(filled).join(', '));
      return;
    }

    var dest = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(target.tab);
    if (!dest) {
      Logger.log('Tab not found: ' + target.tab);
      return;
    }

    var destHeaders = dest.getRange(1, 1, 1, dest.getLastColumn()).getValues()[0].map(norm);
    var colIndex = {};
    destHeaders.forEach(function (h, i) { colIndex[h] = i; });

    var data = dest.getDataRange().getValues();

    // Next display_order = max existing + 1 (used only when the form left it blank).
    var nextOrder = 1;
    if ('display_order' in colIndex) {
      for (var r = 1; r < data.length; r++) {
        var ord = parseInt(data[r][colIndex['display_order']], 10);
        if (!isNaN(ord) && ord >= nextOrder) nextOrder = ord + 1;
      }
    }

    // Build the row to append, applying sensible defaults.
    var newRow = destHeaders.map(function (h) {
      var val = h in filled ? filled[h] : '';
      if (h === 'display_order' && val === '') val = String(nextOrder);
      if (h === 'is_visible' && val === '') val = 'TRUE';
      return val;
    });

    // Ignore fully-empty rows.
    if (newRow.join('').trim() === '') return;

    // Skip rows that already exist (safe with duplicate triggers/manual rows).
    var fields = [];
    for (var c = 0; c < destHeaders.length; c++) {
      if (newRow[c] !== '') fields.push(c);
    }
    for (var r = 1; r < data.length; r++) {
      var identical = fields.every(function (c) { return String(data[r][c]) === String(newRow[c]); });
      if (identical) {
        Logger.log('Duplicate row skipped for ' + target.tab);
        return;
      }
    }

    dest.appendRow(newRow);
    Logger.log('Added row to ' + target.tab);
  } catch (err) {
    Logger.log('onFormSubmit error: ' + err);
  }
}

function norm(s) {
  return String(s == null ? '' : s).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}