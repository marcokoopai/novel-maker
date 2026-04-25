import { Theme, ThemeVariant } from '../types'

export const THEMES: Record<ThemeVariant, Theme> = {
  parchment: {
    accent: '#C17F3E',
    accent2: '#7A9B76',
    font: { heading: "'Playfair Display','Noto Serif TC',serif", body: "'Noto Serif TC',serif" },
    app: { bg: '#F0EAE0', text: '#2C2416' },
    sidebar: { bg: '#EDE8DF', border: '#D4C9B5', text: '#2C2416', textMuted: '#8B7355', activeItem: '#DDD5C566', activeBg: '#DDD5C544', hoverBg: '#E5DDD033' },
    editor: { bg: '#FEFCF8', border: '#D4C9B5', text: '#2C2416', textMuted: '#8B7355', toolbarBg: '#F5F0E8' },
    panel: { bg: '#F5F0E8', border: '#D4C9B5', text: '#2C2416', textMuted: '#8B7355', activeBg: '#EDE8DF' },
    modal: { bg: '#FEFCF8', border: '#D4C9B5', text: '#2C2416', textMuted: '#8B7355', headerBg: '#F5F0E8', inputBg: '#F5F0E8' },
    statusBar: { bg: '#DDD5C5', text: '#8B7355' },
  },
  midnight: {
    accent: '#E8B96A',
    accent2: '#82C9A5',
    font: { heading: "'Playfair Display','Noto Serif TC',serif", body: "'Noto Serif TC',serif" },
    app: { bg: '#1A1C24', text: '#E8E0D0' },
    sidebar: { bg: '#14161E', border: '#2E3040', text: '#E8E0D0', textMuted: '#8890A8', activeItem: '#252830', activeBg: '#252830', hoverBg: '#1E2028' },
    editor: { bg: '#1E2028', border: '#2E3040', text: '#E8E0D0', textMuted: '#8890A8', toolbarBg: '#14161E' },
    panel: { bg: '#14161E', border: '#2E3040', text: '#E8E0D0', textMuted: '#8890A8', activeBg: '#1E2028' },
    modal: { bg: '#1E2028', border: '#2E3040', text: '#E8E0D0', textMuted: '#8890A8', headerBg: '#14161E', inputBg: '#14161E' },
    statusBar: { bg: '#0F1016', text: '#8890A8' },
  },
  minimal: {
    accent: '#3D6B8E',
    accent2: '#6B9E7A',
    font: { heading: "'Playfair Display','Noto Serif TC',serif", body: "'Noto Serif TC',serif" },
    app: { bg: '#F4F4F2', text: '#1C1C1C' },
    sidebar: { bg: '#EFEFED', border: '#DDDCDA', text: '#1C1C1C', textMuted: '#888880', activeItem: '#E4E4E2', activeBg: '#E4E4E2', hoverBg: '#E8E8E6' },
    editor: { bg: '#FFFFFF', border: '#DDDCDA', text: '#1C1C1C', textMuted: '#888880', toolbarBg: '#F4F4F2' },
    panel: { bg: '#F4F4F2', border: '#DDDCDA', text: '#1C1C1C', textMuted: '#888880', activeBg: '#ECECEA' },
    modal: { bg: '#FFFFFF', border: '#DDDCDA', text: '#1C1C1C', textMuted: '#888880', headerBg: '#F4F4F2', inputBg: '#F4F4F2' },
    statusBar: { bg: '#DDDCDA', text: '#888880' },
  },
}
