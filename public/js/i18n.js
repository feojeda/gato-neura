/** @file i18n.js — Lightweight i18n engine with interpolation, HTML support, and reactive locale changes */

const translations = {};
let currentLocale = 'en';
const LISTENERS = new Set();

export function register(locale, dict) {
    translations[locale] = dict;
}

export function setLocale(locale) {
    if (!translations[locale]) locale = 'en';
    currentLocale = locale;
    try { localStorage.setItem('gato-neura-lang', locale); } catch (_) {}
    document.documentElement.lang = locale;
    LISTENERS.forEach(fn => fn(locale));
}

export function getLocale() {
    return currentLocale;
}

export function onLocaleChange(fn) {
    LISTENERS.add(fn);
    return () => LISTENERS.delete(fn);
}

export function t(key, vars = {}) {
    const dict = translations[currentLocale] || translations['en'] || {};
    let str = key.split('.').reduce((o, k) => o?.[k], dict);
    if (typeof str !== 'string') {
        // Fallback chain: current locale → en → key itself
        const enDict = translations['en'] || {};
        str = key.split('.').reduce((o, k) => o?.[k], enDict);
        if (typeof str !== 'string') str = key;
    }
    Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
    return str;
}

/** Get a raw translation value (object, array, etc.) without string interpolation */
export function raw(key) {
    const dict = translations[currentLocale] || translations['en'] || {};
    let val = key.split('.').reduce((o, k) => o?.[k], dict);
    if (val === undefined) {
        const enDict = translations['en'] || {};
        val = key.split('.').reduce((o, k) => o?.[k], enDict);
    }
    return val;
}

/** Scan the DOM for [data-i18n] and [data-i18n-html] attributes and replace content */
export function bindDOM(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (key) el.textContent = t(key);
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.dataset.i18nHtml;
        if (key) el.innerHTML = t(key);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.dataset.i18nTitle;
        if (key) el.title = t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (key) el.placeholder = t(key);
    });
}

/** Detect browser language and map to supported locale */
function detectBrowserLocale() {
    const supported = Object.keys(translations);
    const browserLangs = [
        navigator.language,
        ...(navigator.languages || [])
    ].filter(Boolean);

    for (const lang of browserLangs) {
        const base = lang.split('-')[0].toLowerCase();
        if (supported.includes(base)) return base;
        // Handle zh-CN/zh-TW -> zh
        if (base === 'zh') return 'zh';
    }
    return 'en';
}

/** Initialize: load saved locale, detect browser lang, set html lang, bind DOM */
export function init() {
    let saved;
    try { saved = localStorage.getItem('gato-neura-lang'); } catch (_) {}
    if (saved && translations[saved]) {
        currentLocale = saved;
    } else {
        currentLocale = detectBrowserLocale();
    }
    document.documentElement.lang = currentLocale;
    bindDOM();
}
