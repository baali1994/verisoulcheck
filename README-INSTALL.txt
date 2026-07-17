VERISOUL LIVE NETLIFY TEST PAGE — PASSWORD PROTECTED

Files included in this package:
- index.html
- netlify.toml
- netlify/edge-functions/password-protect.js

Your existing project must also include:
- netlify/functions/verisoul-decision.js

PASSWORD SETUP — REQUIRED
The site is configured to read its password securely from a Netlify environment variable.

In Netlify, open:
Project configuration > Environment variables

Add:
PROTECTED_PAGE_PASSWORD = precise123

Important:
- The password is not stored in GitHub or index.html.
- Give the variable Functions scope if Netlify asks you to choose a scope.
- Trigger a new deploy after adding or changing the password.
- The browser remains unlocked for 24 hours after a successful login.
- Use the Log out button in the lower-right corner to lock it again.

VERISOUL ENVIRONMENT VARIABLES
Also keep your existing Verisoul key in Netlify:
VERISOUL_API_KEY = your Verisoul production API key

Optional:
VERISOUL_API_BASE = https://api.prod.verisoul.ai

DEPLOYMENT WITH GITHUB + NETLIFY
1. Upload the contents of this folder to the root of your GitHub repository.
2. Make sure your existing netlify/functions/verisoul-decision.js file is also present.
3. Connect the repository to your Netlify project.
4. Add PROTECTED_PAGE_PASSWORD with the value precise123.
5. Add or retain VERISOUL_API_KEY.
6. Deploy the site again.
7. Open your Netlify URL and enter precise123.

CURRENT CONFIGURATION
- Site URL: https://testuser1234.netlify.app/
- Verisoul SDK URL: https://js.pocketsinfull.com/bundle.js
- Project ID: 78312c0f-f8b9-47ad-8707-5e1c9e38e311

SECURITY NOTES
- The password check runs in a Netlify Edge Function before static content or Netlify Functions are served.
- The access cookie is HttpOnly, Secure, and SameSite=Strict.
- If PROTECTED_PAGE_PASSWORD is missing, the site fails closed and remains inaccessible.
- A shared password is suitable for a private test or staging page, not highly sensitive personal data.
