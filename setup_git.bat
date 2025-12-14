@echo off
echo Menginisialisasi Git Repository...
git init

echo Menambahkan semua file...
git add .

echo Melakukan commit pertama...
git commit -m "Initial commit: KURO FILM release v1.0"

echo.
echo ========================================================
echo Git Repository berhasil dibuat!
echo.
echo Langkah selanjutnya:
echo 1. Buat repository baru di GitHub.
echo 2. Jalankan perintah berikut (ganti URL dengan repo Anda):
echo    git remote add origin https://github.com/USERNAME/REPO.git
echo    git push -u origin main
echo ========================================================
echo.
pause
