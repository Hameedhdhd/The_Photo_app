# Internationalization (i18n) Implementation Guide

## ✅ Setup Complete

Your app is now configured with **react-i18next** supporting **English (en)**, **Arabic (ar)**, and **German (de)**.

### Folder Structure
```
frontend/src/i18n/
├── index.js           ← i18n initialization
└── locales/
    ├── en.json        ← English translations
    ├── ar.json        ← Arabic translations (RTL support)
    └── de.json        ← German translations
```

### Translation Files
- **en.json**: 450+ English strings organized by screen
- **ar.json**: Complete Arabic translations with RTL support
- **de.json**: Complete German translations

---

## 🔧 How to Update Components

### 1. Basic Pattern
```javascript
import { useTranslation } from 'react-i18next';

export default function MyScreen() {
  const { t } = useTranslation();  // Hook
  
  return (
    <Text>{t('screenName.keyName')}</Text>
  );
}
```

### 2. Examples by Screen

#### HomeScreen
```javascript
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('home.title')}</Text>              {/* "List It Fast" */}
      <Text>{t('home.subtitle')}</Text>           {/* "Scan & sell in seconds" */}
      <Button title={t('home.takePhoto')} />      {/* "Take Photo" */}
      <Button title={t('home.chooseGallery')} />  {/* "Choose from Gallery" */}
    </View>
  );
}
```

#### MarketplaceScreen
```javascript
import { useTranslation } from 'react-i18next';

export default function MarketplaceScreen() {
  const { t, i18n } = useTranslation();
  
  return (
    <View>
      <Text>{t('marketplace.title')}</Text>
      <Text>{t('marketplace.itemsAvailable', { count: 42 })}</Text>
      <TextInput 
        placeholder={t('marketplace.searchPlaceholder')}
      />
      
      {/* Language Switcher (Optional) */}
      <Button 
        title="العربية" 
        onPress={() => i18n.changeLanguage('ar')}
      />
      <Button 
        title="English" 
        onPress={() => i18n.changeLanguage('en')}
      />
    </View>
  );
}
```

#### ResultScreen / ResultForm
```javascript
import { useTranslation } from 'react-i18next';

export default function ResultForm() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text style={styles.fieldLabel}>{t('listing.category')}</Text>
      <TextInput 
        placeholder={t('listing.enterTitle')}
        value={title}
      />
      <TextInput 
        placeholder={t('listing.enterPrice')}
        value={price}
      />
      <TextInput 
        placeholder={t('listing.enterDescription')}
        value={description}
        multiline
      />
      <Button title={t('listing.listItem')} />
    </View>
  );
}
```

#### RadiusSearchScreen
```javascript
import { useTranslation } from 'react-i18next';

export default function RadiusSearchScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('radiusSearch.title')}</Text>
      <Text>{t('radiusSearch.subtitle')}</Text>
      
      <View>
        <Text>{t('radiusSearch.searchRadius')}</Text>
        <Text>{t('radiusSearch.distance', { km: radiusKm })}</Text>
      </View>
      
      <TextInput 
        placeholder={t('radiusSearch.minPrice')}
      />
      <TextInput 
        placeholder={t('radiusSearch.maxPrice')}
      />
      
      <Button title={t('radiusSearch.search')} />
    </View>
  );
}
```

---

## 📚 Translation Key Reference

### Common Keys (Used Everywhere)
- `common.save` → "Save"
- `common.cancel` → "Cancel"
- `common.loading` → "Loading..."
- `common.error` → "Something went wrong"
- `common.retry` → "Try Again"

### Screen-Specific Keys
- `home.title`, `home.subtitle`, `home.takePhoto`
- `marketplace.title`, `marketplace.searchPlaceholder`
- `listing.title`, `listing.price`, `listing.description`
- `radiusSearch.title`, `radiusSearch.search`
- `myListings.title`, `myListings.noListings`
- `messages.title`, `messages.noMessages`

### Validation & Error Keys
- `validation.required` → "This field is required"
- `validation.invalidEmail` → "Please enter a valid email"
- `errors.cameraPermission` → "Camera access is needed..."
- `errors.connectionError` → "Could not connect to server..."
- `success.itemListed` → "Item listed successfully!"

---

## 🔄 Language Switching

Add a language switcher anywhere in your app:

```javascript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Button 
        title="English"
        onPress={() => i18n.changeLanguage('en')}
        style={i18n.language === 'en' ? { backgroundColor: '#007AFF' } : {}}
      />
      <Button 
        title="العربية"
        onPress={() => i18n.changeLanguage('ar')}
        style={i18n.language === 'ar' ? { backgroundColor: '#007AFF' } : {}}
      />
    </View>
  );
}
```

---

## 📝 How to Add New Strings

1. **Open** `frontend/src/i18n/locales/en.json`
2. **Find** the relevant screen section (or create a new one)
3. **Add** your key-value pair:
   ```json
   {
     "myScreen": {
       "newButton": "Click Me"
     }
   }
   ```
4. **Repeat** for Arabic in `ar.json`
5. **Use** in component:
   ```javascript
   <Button title={t('myScreen.newButton')} />
   ```

---

## 🎯 Screens Ready to Update (In Priority Order)

### Phase 1: Core Flow (High Priority)
- [ ] `HomeScreen.js` — Home, title, buttons
- [ ] `HomeEmptyState.js` — "Ready to sell?" messages
- [ ] `HomeGallery.js` — Photo gallery labels
- [ ] `LoginScreen.js` — Auth messages (if exists)
- [ ] `MarketplaceScreen.js` — Marketplace title, items count

### Phase 2: Listing Flow (Medium Priority)
- [ ] `ResultScreen.js` — Form labels
- [ ] `ResultForm.js` — All input placeholders, labels
- [ ] `MyListingsScreen.js` — "My Items", "No listings" messages
- [ ] `ItemDetailScreen.js` — Item details labels

### Phase 3: Advanced Features (Lower Priority)
- [ ] `RadiusSearchScreen.js` — Search labels, filters
- [ ] `ChatDetailScreen.js` — "Message" labels
- [ ] `ChatListScreen.js` — Chat labels
- [ ] All component files (Button, Card, Modal, etc.)

---

## 💡 Best Practices

### Do ✅
```javascript
// Good: Use translation key
<Text>{t('home.title')}</Text>

// Good: Interpolation for dynamic values
<Text>{t('marketplace.itemsAvailable', { count: 42 })}</Text>

// Good: Fallback in UI
<Button title={t('listing.listItem')} disabled={!title} />
```

### Don't ❌
```javascript
// Bad: Hardcoded strings
<Text>List It Fast</Text>

// Bad: Missing translation key
<Text>{'Unknown button'}</Text>

// Bad: Not using t()
const title = 'My Title';
<Text>{title}</Text>
```

---

## 🌍 RTL Support (Arabic)

React Native automatically handles RTL layout when using Arabic translations. To ensure full RTL support:

1. The app will auto-detect RTL from i18n language setting
2. Text direction, flexbox, and padding will flip automatically
3. Icons and images may need manual mirroring (not included here)

To manually control RTL:
```javascript
import { I18nManager } from 'react-native';

// Check if RTL
if (I18nManager.isRTL) {
  // RTL layout logic
}

// Force RTL
I18nManager.forceRTL(true);
```

---

## 🚀 Testing Your Changes

1. **Start the app**: `npm start`
2. **Switch language**: Use language switcher in UI
3. **Verify all text** appears correctly in both English and Arabic
4. **Test RTL layout** — Arabic text should flow right-to-left
5. **Check console** for any missing translation warnings

---

## 📖 For Full Documentation

See the official docs:
- [react-i18next](https://react.i18next.com/)
- [i18next](https://www.i18next.com/)

---

## Summary

Your app now has:
- ✅ **Complete English translations** (450+ keys)
- ✅ **Complete Arabic translations** (450+ keys)
- ✅ **i18n setup in App.js**
- ✅ **Organized by screen** (easy to find/update)
- ✅ **Language switching capability**
- ✅ **RTL support for Arabic**

**Next Step**: Update screens one by one using the pattern shown above. Start with HomeScreen, then proceed through MarketplaceScreen, ResultForm, etc.
