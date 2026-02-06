# Bashing through Bash — Static Site

Simple single-page site for the 12-lesson Bash course. HTML, CSS, JavaScript, and localStorage. Optional chat (OpenRouter via Convex proxy).

## Build

After changing any lesson or the cover/index Markdown:

```bash
npm install   # once
npm run build # generates index.html from .md files
```

## Run

Open `index.html` in a browser (file:// or any static host). No server required.

- **Landing**: Home and course index.
- **Stepper**: Left sidebar; current lesson highlighted; click any lesson to jump.
- **Progress**: Last visited lesson is restored on return. Use “Mark lesson complete” on a lesson to show a done indicator in the stepper (stored in localStorage).
- **Chat**: Floating button (bottom-right). Ask questions about the current lesson; answers use the page content and can include links to other lessons or sections.

## Chat and Convex (Option B proxy)

The chat calls OpenRouter (`arcee-ai/trinity-large-preview:free`) via a Convex HTTP action so the API key stays server-side.

1. **Convex setup (once)**  
   - Run `npx convex dev` and follow the prompts to create/link a Convex project.  
   - In the Convex dashboard, go to your deployment, Settings, Environment Variables, and add `OPENROUTER_API_KEY` with your OpenRouter API key.  
   - Note your deployment URL (e.g. `https://happy-animal-123.convex.site`).

2. **Point the site at the proxy**  
   - In `chat.js`, set `CHAT_PROXY_URL` to that URL (no trailing slash).  
   - Rebuild or refresh the site. The chat will POST to `CHAT_PROXY_URL/api/chat`.

3. **Local dev without Convex**  
   - Leave `CHAT_PROXY_URL` empty. Open the chat, click the gear icon, and paste your OpenRouter API key (stored in localStorage). The chat will call OpenRouter directly from the browser.

**Push functions to dev (abundant-perch-26):** The app uses `https://abundant-perch-26.convex.site`. To get the chat proxy and CORS fix onto that deployment, run once in this repo: `npx convex dev`. Log in if prompted, confirm the deployment is **abundant-perch-26**, and let it sync (it will push `convex/http.ts`). Then stop it with Ctrl+C. After that, the Functions tab for abundant-perch-26 in the dashboard will show the HTTP action and chat will work (with `OPENROUTER_API_KEY` already set there).

**Important:** Use the **.convex.site** URL for the chat proxy (e.g. `https://abundant-perch-26.convex.site`), not `.convex.cloud`. HTTP actions are served from `.convex.site` ([Convex docs](https://docs.convex.dev/functions/http-actions)).

## Deploy to Cloudflare Pages

1. **Build the site** (in this repo):
   ```bash
   npm install
   npm run build
   ```
   This updates `index.html` from the Markdown sources.

2. **What to deploy:** Upload or push the **static output** only:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `chat.js`  
   No server, no Node, no Convex code on Cloudflare—only these four files. (You can deploy the whole repo and set the build command to `npm run build` and output directory to `/` or `.` so that the built `index.html` and assets are served.)

3. **Cloudflare Pages setup:**
   - In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**.
   - **Option A — Git:** Connect your repo; set **Build command** to `npm run build`, **Build output directory** to `.` (root). Cloudflare will run the build and serve `index.html`, `styles.css`, `app.js`, `chat.js`.
   - **Option B — Direct upload:** Zip the project root (after `npm run build`) and upload; ensure `index.html`, `styles.css`, `app.js`, and `chat.js` are at the root of the upload.

4. **No env vars on Cloudflare:** The OpenRouter key stays in Convex. `chat.js` is already set to use `https://abundant-perch-26.convex.site`; the browser will call that URL from your Pages domain. CORS is allowed by the Convex HTTP action.

5. **Optional custom domain:** In Pages, add a custom domain and (if you want) enable HTTPS. The site will work the same; chat requests go from the visitor’s browser to `abundant-perch-26.convex.site`.

## Files

| File | Purpose |
|------|--------|
| `index.html` | Generated SPA (landing + 12 lessons + chat widget). |
| `index.template.html` | Shell with stepper, chat widget, and placeholders; build script injects content. |
| `styles.css` | Layout, typography, code blocks, stepper, chat. |
| `app.js` | Hash routing, show/hide panels, stepper active state, localStorage. |
| `chat.js` | Chat UI, context from current page, proxy/direct OpenRouter, markdown rendering. |
| `build.js` | Converts .md to HTML and writes `index.html`. |
| `convex/http.ts` | Convex HTTP action: POST `/api/chat` forwards to OpenRouter with `OPENROUTER_API_KEY`. |

Source content: `00-cover-and-index.md` and `01-…` through `12-….md`.
