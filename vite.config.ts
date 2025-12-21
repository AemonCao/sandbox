/// <reference types="vitest" />

import { execSync } from 'node:child_process'
import path from 'node:path'
import { unheadVueComposablesImports } from '@unhead/vue'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'

function getGitCommitId() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  }
  catch {
    return 'unknown'
  }
}

function getBuildTime() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

export default defineConfig({
  base: './',
  define: {
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
    __GIT_COMMIT_ID__: JSON.stringify(getGitCommitId()),
  },
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    // https://github.com/posva/unplugin-vue-router
    VueRouter(),
    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    VueMacros({
      defineOptions: false,
      defineModels: false,
      plugins: {
        vue: Vue({
          script: {
            propsDestructure: true,
            defineModel: true,
          },
        }),
      },
    }),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',
        VueRouterAutoImports,
        unheadVueComposablesImports,
        {
          // add any other imports you were relying on
          'vue-router/auto': ['useLink'],
        },
        {
          'pinia': ['defineStore', 'storeToRefs'],
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
          ],
        },
      ],
      dts: true,
      dirs: [
        './src/composables',
      ],
      vueTemplate: true,
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: true,
      resolvers: [NaiveUiResolver()],
    }),

    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    UnoCSS(),

    vueDevTools({
      launchEditor: 'code',
    }),
  ],
})

// https://github.com/vitest-dev/vitest
export const testConfig = {
  environment: 'jsdom' as const,
}
