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
  try {
    const reason = event?.reason?.message || event?.message || '';
    const reasonStr = String(reason || '');
    
    if (
      reasonStr.includes('Failed to fetch') ||
      reasonStr.includes('Load failed') ||
      reasonStr.includes('403') ||
      reasonStr.includes('404') ||
      reasonStr.includes('rejectionHandler') ||
      reasonStr.includes('googleapis.com')
    ) {
      console.warn('Suppressed background network error:', reasonStr);
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
      return true;
    }
  } catch (e) {
    // Ignore errors in the error handler itself
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
