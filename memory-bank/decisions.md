# Technical Decisions

## Chrome Extension Fill Process Reordering (2026-05-14)
- **Decision**: Reorder the `fillForm` process in `inject.js` to fill text fields (title, description, price) *before* uploading photos.
- **Reasoning**: Filling text is near-instant, while photo uploads take time and involve multiple strategies. Filling text first ensures the core information is present immediately, and the user can see progress while photos upload. It also prevents potential React re-renders from wiping out programmatically set text if photo previews load mid-fill.

## Chrome Extension Photo Upload Strategies (2026-05-14)
- **Strategy 1**: Unhide the hidden file input (Kleinanzeigen uses `class="hidden"`), use a native property setter to bypass React's `files` override, and manually trigger the React `onChange` handler.
- **Strategy 2**: Search for the `addImage` button and find its associated hidden file input.
- **Strategy 3**: Search for `onDrop` handlers on parent elements and simulate a file drop.
- **Strategy 4**: Brute-force all file inputs on the page.
- **Fallback**: Added a manual base64-to-File conversion in `dataUrlToFile` if the `fetch()` API fails for data URLs.

## Chrome Extension Multi-Image Support
- **Decision**: Collect all unique image URLs from `image_url` (primary), `image_urls` (array), and `local_images` (drafts).
- **Implementation**: Performed in `popup.js` (for single fill) and `background.js` (for batch fill). Images are fetched via the background service worker to bypass CORS.

## Chrome Extension UI/UX
- **Decision**: Keep the Kleinanzeigen tab open after a fill operation (single or batch).
- **Reasoning**: Allows the user to verify the filled data and manually click "Veröffentlichen" or make final adjustments.
