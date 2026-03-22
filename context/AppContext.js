import React from 'react';

export const AppContext = React.createContext({
  offlineOnly: false,
  toggleOffline: () => {},
  largeIcons: false,
  setLargeIcons: () => {},
  colorBlindMode: false,
  setcolorBlindMode: () => {},
  darkMode: false,
  setDarkMode: () => {},
});
