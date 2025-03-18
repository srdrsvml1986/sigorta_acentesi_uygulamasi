const { spawn } = require('child_process');
const path = require('path');

console.log('React frontend uygulaması başlatılıyor...');

const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

const vite = spawn(command, ['vite'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname)
});

vite.on('error', (error) => {
  console.error('Vite başlatılırken hata oluştu:', error);
});

vite.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Vite işlemi ${code} koduyla sonlandı`);
  }
});

console.log('Frontend geliştirme sunucusu başlatıldı. Tarayıcıda http://localhost:5173 adresine gidin.'); 