/**
 * Hand-rolled cookie parsing so the app doesn't need the cookie-parser
 * package — just the raw Cookie header split on ";".
 */
function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function cookieParser(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  next();
}

module.exports = cookieParser;
