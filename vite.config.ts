/// <reference types="vite/client" />
/// <reference types="vitest" />
/// <reference types="node" /> 

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    base: './',
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        css: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), './src'),
        },
    },
    server: {
        proxy: {
            '/api/anthropic': {
                target: 'https://api.anthropic.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
            },
            '/api/deepseek': {
                target: 'https://api.deepseek.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
            },
            '/api/moonshot': {
                target: 'https://api.moonshot.cn',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/moonshot/, ''),
            },
            '/api/glm': {
                target: 'https://open.bigmodel.cn',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/glm/, ''),
            },
            '/api/openai': {
                target: 'https://api.openai.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/openai/, ''),
            },
            '/api/gemini': {
                target: 'https://generativelanguage.googleapis.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
            },
            '/api/mistral': {
                target: 'https://api.mistral.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/mistral/, ''),
            },
            '/api/grok': {
                target: 'https://api.x.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/grok/, ''),
            },
            '/api/qwen': {
                target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
            },
            '/api/openrouter': {
                target: 'https://openrouter.ai/api/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
            }
        }
    },
})
