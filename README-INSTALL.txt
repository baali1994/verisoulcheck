VERISOUL LIVE NETLIFY TEST PAGE

Files included:
- index.html
- netlify/functions/verisoul-decision.js
- netlify.toml

Your configured values:
- Site URL: https://testuser1234.netlify.app/
- Domain: pocketsinfull.com
- Verisoul custom hostname: js.pocketsinfull.com
- Verisoul SDK URL used in HTML: https://js.pocketsinfull.com/bundle.js
- Project ID used in HTML: 78312c0f-f8b9-47ad-8707-5e1c9e38e311

IMPORTANT:
Do not paste your Verisoul API key inside index.html.
Set it inside Netlify environment variables instead:
VERISOUL_API_KEY = your Verisoul production API key

Optional:
VERISOUL_API_BASE = https://api.prod.verisoul.ai

Deployment option A: GitHub + Netlify
1. Create a GitHub repo.
2. Upload these files exactly as they are.
3. In Netlify, connect this repo to your existing site or create a new site.
4. In Netlify, add environment variable VERISOUL_API_KEY.
5. Deploy.
6. Open https://testuser1234.netlify.app/ and click Run check again.

Deployment option B: Netlify CLI
1. Install Netlify CLI: npm install -g netlify-cli
2. From this folder: netlify login
3. Link existing site: netlify link
4. Set secret: netlify env:set VERISOUL_API_KEY "YOUR_REAL_VERISOUL_API_KEY"
5. Deploy: netlify deploy --prod
6. Open your Netlify URL and test.

If the page says SDK not ready:
- Confirm https://js.pocketsinfull.com/bundle.js opens in browser.
- Confirm Verisoul dashboard custom hostname is Active.
- Confirm project ID matches the same environment as your Verisoul API key.

If backend returns Session ID not found:
- Your SDK project/environment and backend API key/environment do not match.
- Use production project ID with production API key and https://api.prod.verisoul.ai.


AUTO-RUN UPDATE:
- The page now starts the full check automatically on every page load.
- The visible page title and main button no longer say “Verisoul test”.
- Logs remain visible in the Event log panel.
