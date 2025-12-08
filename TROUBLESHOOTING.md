# Troubleshooting Guide

## If you see a blank screen:

1. **Check Browser Console (F12)**
   - Open Developer Tools (F12)
   - Go to the Console tab
   - Look for any red error messages
   - Share the errors with the team

2. **Verify Dev Server is Running**
   - Make sure `npm run dev` is running
   - Check the terminal for any errors
   - The URL should be `http://localhost:5173`

3. **Check Network Tab**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Refresh the page
   - Look for any failed requests (red entries)

4. **Common Issues:**
   - **Missing .env file**: Make sure you have `.env` with Supabase credentials
   - **Port already in use**: Try a different port or kill the process
   - **Node modules not installed**: Run `npm install`
   - **Browser cache**: Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

5. **Test if React is Working:**
   - You should see "Syntax Slayer - Battle System" heading
   - If you don't see this, React isn't rendering

## Expected Output:
- Dark blue background (#1a1a2e)
- "⚔️ Battle Modal Example ⚔️" heading in cyan
- "Start Battle" button
- When clicked, the Battle Modal should appear

