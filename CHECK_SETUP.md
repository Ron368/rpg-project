# Quick Setup Check

## Step-by-Step Troubleshooting:

### 1. **Check if dev server is running:**
```bash
cd rpg-project
npm run dev
```

You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 2. **Open Browser Console (F12)**
- Press F12 to open Developer Tools
- Go to the **Console** tab
- Look for any **RED error messages**
- Check if you see these messages:
  - "App component mounted"
  - "BattleModalExample component mounted"

### 3. **Check Network Tab**
- In Developer Tools, go to **Network** tab
- Refresh the page (Ctrl+R)
- Look for any failed requests (red entries)
- Check if `main.jsx` loads successfully

### 4. **Verify Files Exist:**
Make sure these files exist:
- ✅ `src/App.jsx`
- ✅ `src/main.jsx`
- ✅ `src/components/BattleModal.jsx`
- ✅ `src/components/BattleModalExample.jsx`
- ✅ `index.html`

### 5. **Check for JavaScript Errors:**
Common errors to look for:
- `Cannot find module` - Missing imports
- `Failed to fetch` - Network/CORS issues
- `ReferenceError` - Variable not defined
- `TypeError` - Wrong data type

### 6. **Hard Refresh Browser:**
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

### 7. **Clear Browser Cache:**
- Open DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 8. **Check Port:**
If port 5173 is busy, Vite will use a different port. Check the terminal output for the actual URL.

### 9. **Verify .env File (Optional):**
The app should work even without Supabase. If you see errors about Supabase, that's okay - the BattleModal will use a fallback question.

## What You Should See:

1. **Dark blue background** (#1a1a2e)
2. **"⚔️ Syntax Slayer - Battle System ⚔️"** heading in cyan
3. **"If you can see this, React is working!"** text
4. **"⚔️ Battle Modal Example ⚔️"** section
5. **"Start Battle"** button (cyan/blue button)

## If Still Blank:

1. **Check terminal for errors** - Look for red error messages
2. **Check browser console** - Look for red error messages
3. **Try a different browser** - Sometimes browser extensions cause issues
4. **Check if Node.js is installed:** `node --version`
5. **Reinstall dependencies:** 
   ```bash
   cd rpg-project
   rm -rf node_modules
   npm install
   npm run dev
   ```

## Still Not Working?

Share these details:
1. Screenshot of browser console (F12 → Console tab)
2. Screenshot of terminal output
3. Any error messages you see

