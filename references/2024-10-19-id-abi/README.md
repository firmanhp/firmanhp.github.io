# Demonstrasi ABI

Kode referensi untuk post tentang ABI. Kode disini mendemonstrasikan _ABI
breakage_ pada sebuah library.

Kode disini hanya dites menggunakan Mac OSX dengan arsitektur ARM64. Hasil
kompilasi untuk platform yang lain mungkin akan berbeda.

## Build

Persiapkan Make dan compiler C++ yang sudah support C++17. Makefile disini
menggunakan `g++`.

### Library
Build setiap library versi 1 dan versi 2 dengan menggunakan Make.
```
make -C my_library_v1 all
make -C my_library_v2 all
```

### Main
Cukup jalankan `make all` untuk build executable `main`.

## Eksekusi

Eksekusi program `main` mengharuskan kita untuk spesifikasi lokasi `shared
library` yang bisa digunakan. Shortcut sudah disediakan melalui Makefile untuk 
eksekusi program menggunakan library versi 1 maupun 2.

Untuk menjalankan program menggunakan library versi 1:

```
make run_v1
```

Untuk menjalankan program menggunakan library versi 2:

```
make run_v2
```
