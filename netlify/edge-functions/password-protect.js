const COOKIE_NAME = "pif_site_access";
const LOGIN_PATH = "/__site-login";
const LOGOUT_PATH = "/__site-logout";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function loginPage({ error = "", configurationError = false } = {}) {
  const message = configurationError
    ? "This page is not yet configured. The site owner needs to set the PROTECTED_PAGE_PASSWORD environment variable."
    : error;

  const form = configurationError
    ? ""
    : `
      <form method="POST" action="${LOGIN_PATH}">
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          autofocus
          required
        />
        <button type="submit">Unlock site</button>
      </form>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Protected Site</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #0f1115;
      color: #e8ecf3;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(100%, 420px);
      padding: 28px;
      border: 1px solid #2a3140;
      border-radius: 16px;
      background: #171a21;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .35);
    }
    h1 { margin: 0 0 8px; font-size: 25px; }
    p { margin: 0 0 20px; color: #98a2b3; line-height: 1.5; }
    .error {
      margin-bottom: 16px;
      padding: 11px 12px;
      border: 1px solid #7f2d35;
      border-radius: 10px;
      background: #361a20;
      color: #ffb4bb;
      font-size: 14px;
    }
    label { display: block; margin-bottom: 7px; color: #b9c2d0; font-size: 14px; }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #394357;
      border-radius: 10px;
      background: #1d212b;
      color: #fff;
      font: inherit;
      outline: none;
    }
    input:focus { border-color: #56a8ff; box-shadow: 0 0 0 3px rgba(86, 168, 255, .16); }
    button {
      width: 100%;
      margin-top: 14px;
      padding: 12px 14px;
      border: 0;
      border-radius: 10px;
      background: #56a8ff;
      color: #07111f;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main>
    <h1>Password required</h1>
    <p>Enter the password to access this site.</p>
    ${message ? `<div class="error">${escapeHtml(message)}</div>` : ""}
    ${form}
  </main>
</body>
</html>`;
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, private",
      "x-robots-tag": "noindex, nofollow",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
    },
  });
}

function redirect(location) {
  return new Response(null, {
    status: 303,
    headers: {
      location,
      "cache-control": "no-store, private",
    },
  });
}

function addLogoutButton(html) {
  const logoutMarkup = `
<style>
  #site-logout-link {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483647;
    padding: 9px 12px;
    border: 1px solid #394357;
    border-radius: 9px;
    background: #171a21;
    color: #e8ecf3;
    font: 600 13px/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(0,0,0,.28);
  }
  #site-logout-link:hover { background: #242b39; }
</style>
<a id="site-logout-link" href="${LOGOUT_PATH}">Log out</a>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${logoutMarkup}</body>`);
  }
  return `${html}${logoutMarkup}`;
}

export default async function passwordProtect(request, context) {
  const url = new URL(request.url);
  const configuredPassword = Netlify.env.get("PROTECTED_PAGE_PASSWORD");

  if (!configuredPassword) {
    return htmlResponse(loginPage({ configurationError: true }), 503);
  }

  const expectedPasswordHash = await sha256(`password:${configuredPassword}`);
  const expectedSessionToken = await sha256(`session:${configuredPassword}`);

  if (url.pathname === LOGOUT_PATH) {
    context.cookies.delete({ name: COOKIE_NAME, path: "/" });
    return redirect("/");
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method !== "POST") return redirect("/");

    let submittedPassword = "";
    try {
      const formData = await request.formData();
      submittedPassword = String(formData.get("password") || "");
    } catch {
      return htmlResponse(loginPage({ error: "Unable to read the password submission." }), 400);
    }

    const submittedPasswordHash = await sha256(`password:${submittedPassword}`);
    if (!constantTimeEqual(submittedPasswordHash, expectedPasswordHash)) {
      return htmlResponse(loginPage({ error: "Incorrect password. Please try again." }), 401);
    }

    context.cookies.set({
      name: COOKIE_NAME,
      value: expectedSessionToken,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: Date.now() + SESSION_DURATION_MS,
    });

    return redirect("/");
  }

  const suppliedSessionToken = context.cookies.get(COOKIE_NAME) || "";
  const isAuthenticated = constantTimeEqual(
    suppliedSessionToken,
    expectedSessionToken,
  );

  if (!isAuthenticated) {
    return htmlResponse(loginPage());
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store, private");
  const body = addLogoutButton(await response.text());

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
