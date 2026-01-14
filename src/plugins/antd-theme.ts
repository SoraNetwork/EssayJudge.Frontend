/**
 * plugins/antd-theme.ts
 *
 * Ant Design Vue 主题配置 - 支持明亮/暗黑模式
 */

import { theme } from 'ant-design-vue'

// 明亮主题配置
const lightTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorTextBase: '#000000d9',
    colorTextSecondary: '#00000073',
    colorBorder: '#d9d9d9',
    borderRadius: 8,
  },
  components: {
    Menu: {
      colorBgContainer: '#1890ff',
      colorItemBg: 'transparent',
      colorItemText: '#ffffff',
      colorItemTextSelected: '#ffffff',
      colorItemBgSelected: 'rgba(255, 255, 255, 0.2)',
      colorItemTextHover: '#ffffff',
      colorItemBgHover: 'rgba(255, 255, 255, 0.1)',
    },
    Layout: {
      headerBg: '#1890ff',
      footerBg: '#f0f2f5',
      bodyBg: '#f0f2f5',
      siderBg: '#001529',
    },
  },
}

// 暗黑主题配置
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#177ddc',
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#d32029',
    colorInfo: '#177ddc',
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#000000',
    colorTextBase: '#ffffffd9',
    colorTextSecondary: '#ffffff73',
    colorBorder: '#434343',
    borderRadius: 8,
  },
  components: {
    Menu: {
      colorBgContainer: '#1f1f1f',
      colorItemBg: 'transparent',
      colorItemText: '#ffffffd9',
      colorItemTextSelected: '#177ddc',
      colorItemBgSelected: 'rgba(23, 125, 220, 0.15)',
      colorItemTextHover: '#ffffffd9',
      colorItemBgHover: 'rgba(255, 255, 255, 0.05)',
    },
    Layout: {
      headerBg: '#1f1f1f',
      footerBg: '#141414',
      bodyBg: '#000000',
      siderBg: '#1f1f1f',
    },
    Table: {
      colorBgContainer: '#1f1f1f',
      headerBg: '#262626',
      headerColor: '#ffffffd9',
    },
    Card: {
      colorBgContainer: '#1f1f1f',
    },
    Drawer: {
      colorBgElevated: '#1f1f1f',
    },
    Modal: {
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
    },
    Select: {
      colorBgElevated: '#1f1f1f',
      optionActiveBg: 'rgba(23, 125, 220, 0.1)',
    },
    Dropdown: {
      colorBgElevated: '#1f1f1f',
    },
  },
}

export { lightTheme, darkTheme }