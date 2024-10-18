import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

import NavBar from './components/NavBar';

const config: DocsThemeConfig = {
  search: {
    component: null,
  },
  navbar: {
    component: NavBar,
  },
}

export default config;
