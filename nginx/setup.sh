#!/bin/bash

# Nama file konfigurasi nginx
CONFIG_NAME="dashboard.conf"

# Path ke file konfigurasi lokal
LOCAL_CONFIG="/var/www/downloader/dashboard/$CONFIG_NAME"

# Tujuan
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

# Fungsi untuk unregister
unregister_config() {
  echo "�� Unregister konfigurasi lama..."

  if [ -L "$SITES_ENABLED/$CONFIG_NAME" ]; then
    echo "❌ Menghapus symlink di sites-enabled..."
    sudo rm "$SITES_ENABLED/$CONFIG_NAME"
  fi

  if [ -f "$SITES_AVAILABLE/$CONFIG_NAME" ]; then
    echo "❌ Menghapus file di sites-available..."
    sudo rm "$SITES_AVAILABLE/$CONFIG_NAME"
  fi
}

# Unregister jika sudah ada
unregister_config

# Cek apakah file lokal ada
if [ ! -f "$LOCAL_CONFIG" ]; then
  echo "❌ Konfigurasi lokal tidak ditemukan: $LOCAL_CONFIG"
  exit 1
fi

# Salin ke sites-available
echo "�� Menyalin $CONFIG_NAME ke $SITES_AVAILABLE..."
sudo cp "$LOCAL_CONFIG" "$SITES_AVAILABLE/$CONFIG_NAME"

# Buat symlink ke sites-enabled
echo "�� Membuat symlink ke $SITES_ENABLED..."
sudo ln -s "$SITES_AVAILABLE/$CONFIG_NAME" "$SITES_ENABLED/$CONFIG_NAME"

# Validasi konfigurasi Nginx
echo "�� Mengecek konfigurasi nginx..."
if sudo nginx -t; then
  echo "✅ Konfigurasi valid. Reload Nginx..."
  sudo systemctl reload nginx
else
  echo "❌ Konfigurasi nginx tidak valid. Silakan periksa pesan di atas."
  unregister_config
  exit 1
fi

