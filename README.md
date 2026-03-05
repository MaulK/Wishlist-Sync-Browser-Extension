# Wishlist Sync Browser Extension

A powerful browser extension that allows you to sync your wishlists across multiple shopping websites. Automatically detect wishlist items on supported sites, track prices, and manage everything from a unified dashboard.

## 🌟 Features

- **Automatic Wishlist Detection**: Detects items when you browse supported shopping sites
- **One-Click Sync**: Save items from any supported site to your unified wishlist
- **Cross-Site Sync**: Sync wishlists between different e-commerce platforms
- **Unified Dashboard**: Centralized view of all wishlist items from different sites
- **Price Tracking**: Monitor price changes and get notified of discounts
- **Availability Alerts**: Get notified when items go back in stock
- **Export/Import**: Export wishlist as CSV or JSON, and import from other sources
- **Smart Organization**: Categories, tags, and search functionality
- **Mobile Compatible**: Works on desktop and mobile browsers

## 🛒 Supported Shopping Sites

- Amazon (US, UK, CA, DE, FR, ES, IT, IN, AU, JP)
- eBay (US, UK, CA, DE, FR, ES, IT, AU)
- Walmart
- Target
- Best Buy (US, CA)
- Etsy
- AliExpress
- ASOS
- Zara
- Nike
- Tokopedia
- Shopee (ID, SG, MY)
- TikTok Shop
- Blibli

## 📋 Requirements

- Chrome 88+, Firefox 85+, Edge 88+, or Safari 14+
- Active internet connection for price tracking
- Storage permissions for saving wishlist data

## 🚀 Installation

### Chrome/Edge (Chromium-based browsers)

1. Download the extension files as a ZIP or clone this repository
2. Extract the files to a folder on your computer
3. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
4. Enable **Developer mode** (toggle in the top right corner)
5. Click **Load unpacked**
6. Select the folder where you extracted the extension files
7. The extension should now appear in your extensions list

### Firefox

1. Download the extension files as a ZIP or clone this repository
2. Extract the files to a folder on your computer
3. Open Firefox and navigate to `about:debugging`
4. Click **This Firefox** → **Load Temporary Add-on**
5. Select the `manifest.json` file from the extracted folder
6. The extension should now be installed

### Safari

1. Download the extension files as a ZIP or clone this repository
2. Open Safari → Preferences → Extensions
3. Check the box for **Allow Unsigned Extensions**
4. Open the extracted folder in Xcode
5. Build and run the extension
6. Enable the extension in Safari preferences

## 📖 Usage Guide

### Adding Items to Your Wishlist

1. **Automatic Detection**: Browse to a product page on a supported site. The extension will automatically detect the item.
2. **Popup Button**: Click the extension icon in your browser toolbar to see detected items.
3. **Add Button**: Click "Add to Wishlist" to save the item.

### Viewing Your Wishlist

1. Click the extension icon and select "Open Dashboard"
2. View all your items in a grid or list view
3. Filter by site, category, or search for specific items
4. Sort by date, price, or name

### Managing Items

- **View Details**: Click on an item to see full details, price history, and notes
- **Edit**: Click the edit button to modify item details, notes, or tags
- **Delete**: Remove items from your wishlist
- **Check Price**: Manually check for price updates on any item

### Price Tracking

1. Items are automatically checked for price changes every 6 hours (configurable)
2. You'll receive notifications when prices drop
3. View price history charts on item detail pages
4. Set a price drop threshold for notifications

### Exporting/Importing

1. Go to Settings → Data Management
2. Click "Export JSON" or "Export CSV" to download your wishlist
3. To import, click "Import File" and select your JSON or CSV file

## ⚙️ Configuration

### Notification Settings

- **Enable Notifications**: Turn on/off all notifications
- **Price Drop Threshold**: Only notify when price drops by this percentage
- **Check Interval**: How often to check for price updates (3, 6, 12, or 24 hours)

### Display Settings

- **Currency**: Default currency for displaying prices
- **Show Price History**: Display price history charts
- **Default Category**: Category assigned to new items

### Data Management

- **Export Data**: Backup your wishlist to JSON or CSV
- **Import Data**: Restore from backup or import from other sources
- **Clear All Data**: Delete all items and settings

## 🔒 Privacy & Security

- All data is stored locally in your browser's storage
- No personal data is sent to external servers
- Optional cloud sync requires explicit user consent
- Only reads product pages on supported shopping sites
- No tracking or analytics

## 🐛 Troubleshooting

### Extension not detecting items

- Make sure you're on a supported shopping site
- Refresh the page and try again
- Check that the extension has permission to access the site
- Try reloading the extension

### Price tracking not working

- Check your internet connection
- Verify the check interval setting
- Manually refresh prices from the item details page
- Check if the site has changed its structure

### Notifications not appearing

- Check browser notification permissions
- Verify notifications are enabled in extension settings
- Check the price drop threshold setting

### Import/Export issues

- Ensure you're using a valid JSON or CSV file
- Check that the file format is correct
- Try exporting first to see the expected format
- Clear browser cache and try again

## 📝 Data Structure

Each wishlist item contains:

```json
{
  "id": "unique-item-id",
  "title": "Product Name",
  "url": "https://example.com/product",
  "image": "https://example.com/image.jpg",
  "price": 99.99,
  "originalPrice": 129.99,
  "discount": 23,
  "site": "Amazon",
  "category": "Electronics",
  "tags": ["birthday", "wishlist"],
  "addedDate": "2024-01-15",
  "lastChecked": "2024-01-20",
  "priceHistory": [
    { "date": "2024-01-15", "price": 129.99 },
    { "date": "2024-01-20", "price": 99.99 }
  ],
  "availability": "In Stock",
  "notes": "Great reviews, need to check battery life"
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Clone the repository
2. Load the extension in developer mode
3. Make changes to the source files
4. Reload the extension to test changes
5. Use browser DevTools for debugging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icon design inspired by modern e-commerce platforms
- Built with vanilla JavaScript for maximum compatibility
- Uses Chrome Storage API for data persistence
- Manifest V3 for modern browser extension standards

## 📞 Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: See the `/docs` folder for detailed guides
- **Email**: support@wishlistsync.com (for enterprise support)

## 🔮 Roadmap

- [ ] Mobile app companion
- [ ] Cloud sync with account system
- [ ] Browser sync across devices
- [ ] Price prediction using AI
- [ ] Social sharing of wishlists
- [ ] Collaborative wishlists
- [ ] Price alerts via SMS/email
- [ ] Integration with more shopping sites
- [ ] Browser extension for mobile browsers

## 📊 Version History

### Version 1.0.0 (2024-01-15)
- Initial release
- Support for 14+ shopping sites
- Price tracking and notifications
- Export/Import functionality
- Responsive dashboard UI

---

Made with ❤️ by the Wishlist Sync Team
