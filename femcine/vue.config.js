const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  // Las rutas se resuelven desde la raíz (Vercel, servidor local).
  publicPath: '/',
  devServer: {
    // Permite recargar rutas como /peliculas/:id en desarrollo.
    historyApiFallback: true
  },
  // Silencia el aviso de tamaño: los fondos originales pesan más de 250 KB.
  configureWebpack: {
    performance: { hints: false }
  }
});
