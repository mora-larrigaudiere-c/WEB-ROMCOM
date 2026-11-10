const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  // Las rutas se resuelven desde la raíz (Vercel, servidor local).
  publicPath: '/',
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    // Permite recargar rutas como /peliculas/:id en desarrollo.
    historyApiFallback: true
  },
  // Silencia el aviso de tamaño: los fondos originales pesan más de 250 KB.
  configureWebpack: {
    performance: { hints: false }
  }
});
