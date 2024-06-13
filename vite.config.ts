import react from '@vitejs/plugin-react-swc';
import path from "path";
import { defineConfig } from "vite";
import { loadEnv } from 'vite';



export default defineConfig({
    //load env
    env: loadEnv('development', process.cwd()),
    base: '/d3gallery/',
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    // define:{
    //     //not sure if mandatory
    //     'process.env.VITE_STEAM_API_KEY': JSON.stringify(process.env.VITE_STEAM_API_KEY),
    //     'process.env.VITE_STEAM_PROFILE': JSON.stringify(process.env.VITE_STEAM_PROFILE),
    // },
    server: {
        // host: '0.0.0.0', // Allow connections from outside
        port: 5173,
        watch: {
            usePolling: true,
        },
        proxy: {
            // Proxy setup for Steam API
            '/steam-api': {
                //target must be where the api is hosted
                target: 'https://api.steampowered.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/steam-api/, '')
            },
            '/btc': {
                target: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/btc/, '')
            },

            // example proxy for an express app
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
});
