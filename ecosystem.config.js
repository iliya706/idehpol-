// پیکربندی PM2 برای اجرای دائمی سایت روی VPS
//   npm i -g pm2
//   npm run build
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "idehpol",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // DATABASE_URL و SESSION_SECRET را در فایل .env همین مسیر قرار دهید
      },
    },
  ],
};
