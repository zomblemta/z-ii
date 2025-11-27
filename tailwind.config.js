/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layout/**/*.liquid',
    './sections/**/*.liquid', 
    './snippets/**/*.liquid',
    './templates/**/*.liquid',
    './assets/**/*.js'
  ],
  theme: {
    extend: {
      // 使用 Dawn 主题的颜色变量
      colors: {
        'background': 'rgb(var(--color-background))',
        'foreground': 'rgb(var(--color-foreground))',
        'button': 'rgb(var(--color-button))',
        'button-text': 'rgb(var(--color-button-text))',
        'secondary-button': 'rgb(var(--color-secondary-button))',
        'secondary-button-text': 'rgb(var(--color-secondary-button-text))',
        'link': 'rgb(var(--color-link))',
        'badge-foreground': 'rgb(var(--color-badge-foreground))',
        'badge-background': 'rgb(var(--color-badge-background))',
        'badge-border': 'rgb(var(--color-badge-border))',
        'shadow': 'rgb(var(--color-shadow))',
      },
      // 使用 Dawn 主题的字体设置
      fontFamily: {
        'body': 'var(--font-body-family)',
        'heading': 'var(--font-heading-family)',
      },
      fontSize: {
        'body': 'calc(var(--font-body-scale) * 1.5rem)',
        'body-desktop': 'calc(var(--font-body-scale) * 1.6rem)',
      },
      // 使用 Dawn 主题的间距和尺寸
      spacing: {
        'section': 'var(--spacing-sections-desktop)',
        'section-mobile': 'var(--spacing-sections-mobile)',
        'grid-vertical': 'var(--grid-desktop-vertical-spacing)',
        'grid-horizontal': 'var(--grid-desktop-horizontal-spacing)',
        'grid-vertical-mobile': 'var(--grid-mobile-vertical-spacing)',
        'grid-horizontal-mobile': 'var(--grid-mobile-horizontal-spacing)',
      },
      borderRadius: {
        'button': 'var(--buttons-radius)px',
        'input': 'var(--inputs-radius)px',
        'card': 'var(--product-card-corner-radius)',
        'media': 'var(--media-radius)px',
        'badge': 'var(--badge-corner-radius)',
      },
      maxWidth: {
        'page': 'var(--page-width)',
      },
      width: {
        'max-content': 'max-content',
      },
      boxShadow: {
        'button': 'var(--buttons-shadow-horizontal-offset)px var(--buttons-shadow-vertical-offset)px var(--buttons-shadow-blur-radius)px rgba(var(--color-shadow), var(--buttons-shadow-opacity))',
        'card': 'var(--product-card-shadow-horizontal-offset)px var(--product-card-shadow-vertical-offset)px var(--product-card-shadow-blur-radius)px rgba(var(--color-shadow), var(--product-card-shadow-opacity))',
        'input': 'var(--inputs-shadow-horizontal-offset)px var(--inputs-shadow-vertical-offset)px var(--inputs-shadow-blur-radius)px rgba(var(--color-shadow), var(--inputs-shadow-opacity))',
      },
      // 响应式断点 - 网页通用标准
      screens: {
        'xs': '480px',    // 超小屏幕 (大屏手机)
        'sm': '640px',    // 小屏幕 (平板竖屏)
        'md': '768px',    // 中等屏幕 (平板横屏)
        'lg': '1024px',   // 大屏幕 (小笔记本)
        'xl': '1200px',   // 超大屏幕 (桌面)
        '2xl': '1440px',  // 超超大屏幕 (大桌面)
      }
    },
  },
  plugins: [],
  // 确保 Tailwind 不会覆盖现有的 Dawn 样式
  corePlugins: {
    preflight: false,
  },
} 