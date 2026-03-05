# Testing Guide - Wishlist Sync Browser Extension

This document provides comprehensive testing instructions for the Wishlist Sync extension.

## 🧪 Pre-Installation Testing

### File Structure Verification

Before installing, verify the following files exist:

```
wishlist-sync/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── dashboard.html
├── dashboard.js
├── item-details.html
├── item-details.js
├── settings.html
├── settings.js
├── login.html
├── login.js
├── styles.css
├── utils.js
├── storage.js
├── data/
│   └── supported-sites.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
└── TESTING.md
```

### Manifest Validation

1. Open `manifest.json` in a text editor
2. Validate JSON syntax using an online validator
3. Verify all required fields are present:
   - `manifest_version`: 3
   - `name`: "Wishlist Sync Browser Extension"
   - `version`: "1.0.0"
   - `permissions`: storage, activeTab, notifications, alarms, tabs, scripting
   - `host_permissions`: All supported shopping site domains

## 🚀 Installation Testing

### Chrome/Edge Installation

1. Navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
5. Verify the extension appears in the list
6. Check for any error messages in the extensions page

### Firefox Installation

1. Navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json`
4. Verify the extension is loaded
5. Check the Browser Console for any errors

### Post-Installation Checks

- [ ] Extension icon appears in browser toolbar
- [ ] No error messages in extensions page
- [ ] Extension permissions are correctly requested
- [ ] Background service worker is running (check in DevTools)

## 🧪 Functional Testing

### 1. Popup Interface

**Test Steps:**
1. Click the extension icon
2. Verify the popup opens correctly
3. Check all UI elements are visible:
   - [ ] Header with logo and settings button
   - [ ] Page status indicator
   - [ ] Stats summary (items, savings, drops)
   - [ ] Recent items list
   - [ ] Footer with dashboard button

**Expected Results:**
- Popup loads within 1 second
- All elements are properly aligned
- Empty state shows when no items exist

### 2. Item Detection on Shopping Sites

**Test Sites:**
- Amazon (any product page)
- eBay (any product page)
- Walmart (any product page)

**Test Steps:**
1. Navigate to a product page on a supported site
2. Click the extension icon
3. Verify the page is detected
4. Check that item details are extracted:
   - [ ] Title
   - [ ] Price
   - [ ] Image
   - [ ] Site name

**Expected Results:**
- Page status shows "Detected: [Site Name]"
- Item preview displays correctly
- "Add to Wishlist" button is enabled

### 3. Adding Items to Wishlist

**Test Steps:**
1. On a detected product page, click "Add to Wishlist"
2. Verify success message appears
3. Check the item appears in recent items
4. Navigate to the dashboard
5. Verify the item is in the main list

**Expected Results:**
- Toast notification confirms addition
- Item appears immediately in recent items
- Item persists after closing and reopening popup
- Item appears in dashboard with correct details

### 4. Dashboard Interface

**Test Steps:**
1. Open the dashboard
2. Verify all sections load:
   - [ ] Header with navigation
   - [ ] Stats cards
   - [ ] Filter controls
   - [ ] Items grid/list
   - [ ] Pagination (if applicable)

**Expected Results:**
- Dashboard loads within 2 seconds
- All sections are visible
- Stats show correct counts
- Items display in grid view by default

### 5. Filtering and Sorting

**Test Steps:**
1. Add items from different sites
2. Test site filter:
   - [ ] Select "Amazon"
   - [ ] Verify only Amazon items show
3. Test search:
   - [ ] Enter a search term
   - [ ] Verify matching items appear
4. Test sorting:
   - [ ] Sort by price (low to high)
   - [ ] Verify items reorder correctly
   - [ ] Sort by date (newest first)
   - [ ] Verify items reorder correctly

**Expected Results:**
- Filters work independently
- Search is case-insensitive
- Sort order is correct
- View toggle switches between grid and list

### 6. Item Details Page

**Test Steps:**
1. Click on an item in the dashboard
2. Verify the details page loads:
   - [ ] Large image
   - [ ] Full title
   - [ ] Price information
   - [ ] Price history chart
   - [ ] Notes section
   - [ ] Tags section
3. Test "View on Site" button
4. Test "Refresh Price" button

**Expected Results:**
- All item details display correctly
- External link opens in new tab
- Price history chart renders (if data exists)
- Notes and tags can be edited

### 7. Editing Items

**Test Steps:**
1. Click the edit button on an item
2. Modify the following:
   - [ ] Change category
   - [ ] Add tags
   - [ ] Add notes
3. Save changes
4. Verify updates appear

**Expected Results:**
- Edit modal opens with current values
- Changes save successfully
- Toast notification confirms save
- Updates reflect immediately

### 8. Deleting Items

**Test Steps:**
1. Click the delete button on an item
2. Confirm deletion
3. Verify item is removed
4. Check stats update

**Expected Results:**
- Confirmation dialog appears
- Item disappears from list
- Total items count decreases
- Toast notification confirms deletion

### 9. Price Tracking

**Test Steps:**
1. Add an item with a known price
2. Wait for price check interval (or manually trigger)
3. Check if price updates
4. Verify price history is recorded

**Expected Results:**
- Price updates when detected
- Price history shows previous prices
- Price drop badge appears if price decreased
- Notification is sent for price drops

### 10. Export/Import

**Export Test:**
1. Add several items to wishlist
2. Go to Settings → Data Management
3. Click "Export JSON"
4. Verify file downloads
5. Open the file and check format

**Import Test:**
1. Clear all items (or use a fresh installation)
2. Go to Settings → Data Management
3. Click "Import File"
4. Select the exported JSON file
5. Verify items are restored

**Expected Results:**
- Export file is valid JSON/CSV
- All item data is included
- Import restores items correctly
- Duplicate items are skipped

### 11. Settings

**Test Steps:**
1. Open settings page
2. Modify each setting:
   - [ ] Toggle notifications
   - [ ] Change price drop threshold
   - [ ] Change check interval
   - [ ] Change currency
   - [ ] Toggle show price history
   - [ ] Change default category
3. Click "Save Settings"
4. Verify changes persist

**Expected Results:**
- All settings load correctly
- Changes save successfully
- Settings persist after reload
- Toast notification confirms save

### 12. Notifications

**Test Steps:**
1. Enable notifications in settings
2. Add an item with a price
3. Simulate a price drop (or wait)
4. Verify notification appears
5. Click notification
6. Verify it opens the item details

**Expected Results:**
- Notification permission is requested
- Notifications appear for price drops
- Notifications are clickable
- Notification content is accurate

## 🐛 Error Handling Testing

### 1. Network Errors

**Test Steps:**
1. Disconnect internet
2. Try to add an item
3. Try to check prices
4. Reconnect and retry

**Expected Results:**
- Graceful error message appears
- Extension remains functional
- Operations succeed after reconnect

### 2. Invalid URLs

**Test Steps:**
1. Try to add item with malformed URL
2. Try to import invalid file
3. Try to export with no items

**Expected Results:**
- Validation error appears
- No data corruption
- User receives helpful error message

### 3. Storage Limits

**Test Steps:**
1. Add many items (100+)
2. Verify performance remains acceptable
3. Check storage usage in settings

**Expected Results:**
- Performance remains good
- Storage usage is accurate
- No data loss occurs

## 📱 Cross-Browser Testing

### Chrome
- [ ] Version 88+
- [ ] Manifest V3 compatibility
- [ ] All features work correctly

### Firefox
- [ ] Version 85+
- [ ] WebExtension compatibility
- [ ] All features work correctly

### Edge
- [ ] Version 88+
- [ ] Chromium compatibility
- [ ] All features work correctly

### Safari (if applicable)
- [ ] Version 14+
- [ ] App Extension compatibility
- [ ] All features work correctly

## 🎨 UI/UX Testing

### Responsive Design

**Test on different screen sizes:**
- [ ] 1920x1080 (Desktop)
- [ ] 1366x768 (Laptop)
- [ ] 768x1024 (Tablet)
- [ ] 375x667 (Mobile)

**Expected Results:**
- Layout adapts to screen size
- All elements remain accessible
- No horizontal scrolling on mobile

### Accessibility

**Test Steps:**
1. Navigate using keyboard only
2. Test with screen reader
3. Check color contrast
4. Verify focus indicators

**Expected Results:**
- All interactive elements are keyboard accessible
- Screen reader announces content correctly
- Color contrast meets WCAG AA standards
- Focus is clearly visible

## 📊 Performance Testing

### Load Times

- [ ] Popup loads < 1 second
- [ ] Dashboard loads < 2 seconds
- [ ] Item details loads < 1 second
- [ ] Settings loads < 1 second

### Memory Usage

- [ ] Idle memory < 50MB
- [ ] Memory doesn't grow unbounded
- [ ] No memory leaks detected

### Storage Usage

- [ ] 100 items < 5MB
- [ ] Storage doesn't exceed quota
- [ ] Efficient data storage

## ✅ Pre-Launch Checklist

- [ ] All functional tests pass
- [ ] All error handling tests pass
- [ ] Cross-browser testing complete
- [ ] UI/UX testing complete
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Documentation complete
- [ ] Icons created and tested
- [ ] README is comprehensive
- [ ] No console errors in normal operation
- [ ] Extension works offline (for viewing)
- [ ] Extension permissions are minimal
- [ ] User data is properly handled
- [ ] Privacy policy is clear
- [ ] Terms of service are clear

## 🐛 Known Issues

Document any known issues or limitations:

1. *Issue description*
   - Impact: High/Medium/Low
   - Workaround: *description*
   - Planned fix: *version*

## 📝 Test Results Log

| Date | Tester | Browser | Version | Result | Notes |
|------|--------|---------|---------|--------|-------|
| | | | | | |
| | | | | |
| | | | | |

## 🔄 Regression Testing

After each update, re-run:

1. [ ] Core functionality tests
2. [ ] Cross-browser tests
3. [ ] Performance tests
4. [ ] Security tests

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

