
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create preconnect links
const linkPreconnect1 = document.createElement('link');
linkPreconnect1.rel = 'preconnect';
linkPreconnect1.href = 'https://fonts.googleapis.com';
document.head.appendChild(linkPreconnect1);

const linkPreconnect2 = document.createElement('link');
linkPreconnect2.rel = 'preconnect';
linkPreconnect2.href = 'https://fonts.gstatic.com';
linkPreconnect2.crossOrigin = '';
document.head.appendChild(linkPreconnect2);

// Add font with display=swap for better performance
const linkFont = document.createElement('link');
linkFont.rel = 'stylesheet';
linkFont.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap&font-display=swap';
document.head.appendChild(linkFont);

// Add theme-color meta tag for mobile browsers
const metaThemeColor = document.createElement('meta');
metaThemeColor.name = 'theme-color';
metaThemeColor.content = '#ff5722'; // Primary color
document.head.appendChild(metaThemeColor);

createRoot(document.getElementById("root")!).render(<App />);
