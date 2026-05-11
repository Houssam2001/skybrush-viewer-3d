/**
 * @file Module that contains everything that is needed for Skybrush Viewer only
 * when it is being run as a desktop application.
 */

import config from 'config';

import { initI18N } from './i18n';
import { SkybrushViewer } from './startup';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

// Suppress "Failed to fetch" popups for background network errors
const suppressNetworkError = (event: any) => {
  const reason = event.reason?.message || event.message || String(event.reason || event);
  if (
    reason.includes('Failed to fetch') ||
    reason.includes('Load failed') ||
    reason.includes('403') ||
    reason.includes('404') ||
    reason.includes('rejectionHandler') ||
    reason.includes('googleapis.com')
  ) {
    console.warn('Suppressed background network error:', reason);
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
    return true;
  }
  return false;
};

window.addEventListener('unhandledrejection', suppressNetworkError, true);
window.addEventListener('error', suppressNetworkError, true);

await initI18N();

if (config.startAutomatically) {
  // Start the app automatically but do not export it to the page
  SkybrushViewer.run();
} else {
  // Export the SkybrushViewer class to the global context
  (window as any).SkybrushViewer = SkybrushViewer;
}
