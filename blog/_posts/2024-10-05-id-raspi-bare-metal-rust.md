---
title: "Pemrograman Bare Metal dalam Raspberry Pi dengan Rust"
date: 2024-09-12 00:00:00 +0900
categories: [OS]
tags: [qemu, raspberry-pi, bare-metal, systems-programming, indonesia]
description: "(Post in Indonesian) Belajar bare metal programming + Rust"
media_subpath: /assets/2024-10-05-id-raspi-bare-metal-rust
image:
  path: img/thumbnail.jpeg
  alt: Saat debugging program di Raspberry Pi 3.
render_with_liquid: true
---

Dari kemarin sebenernya bingung mau nulis ini dalam Bahasa Inggris atau enggak,
tapi kalau dipikir-pikir resource bare metal programming/OS enggak begitu banyak
dalam Bahasa Indonesia. Setelah ngoding C/C++ dan sempat rame juga tentang Rust
(bahkan ada Zig sekarang), jadinya pengen coba nulis Rust sekalian belajar
tentang hardware.

## Intro

_Bare metal programming_ artinya kita membuat program yang sangat dekat dengan
hardware, seperti microcontroller, SoC. Apa bedanya sama pemrograman sistem
biasa? Disini, kita bener-bener bikin program yang CPU langsung eksekusi tanpa
bantuan OS. Ini artinya:
- Tidak ada _system call_
- Tidak ada library dasar seperti `libc` (karena system callnya pun tidak ada)
- Tidak ada _memory management_: Tidak ada dynamic data structures seperti
dynamic array, _malloc_, etc
- Program bekerja dalam physical memory by default, bukan virtual memory.
- Kita cuma punya instruksi CPU dan hardware-hardware yang ada di SoC.

Kalau programming menggunakan Linux, Bedanya Linux sudah menyediakan interface
system call yang sudah _mature_, dan banyak library-library yang sudah
men-support Linux. Kali ini, kita akan meninggalkan Linux dan bisa dibilang
membuat sistem operasi sendiri. Kita akan menulis program tersebut menggunakan
Rust.

## Persiapan

Kali ini kita akan membuat program bare metal untuk Raspberry Pi 3 Model B (yang
saya punya). Dilihat dari dari
[spesifikasinya](https://www.raspberrypi.com/products/raspberry-pi-3-model-b/),
Raspberry PI 3 Model B menggunakan `Quad Core 1.2GHz Broadcom BCM2837 64bit
CPU`. BCM2837 sendiri pakai ARM Cortex-A53 sebagai core-nya, dengan ARMv8-A.
Artinya, kita harus membuat program yang menggunakan instruksi ARMv8 yang
ditambah dengan peripheral (hardware tambahan) dari BCM2837.

Kita bisa dapatkan datasheet dari BCM2837
[disini](https://github.com/raspberrypi/documentation/issues/325#issuecomment-379651504).
Atau di link yang sudah saya mirrorkan
[disini]({{ site.baseurl }}{{ page.media_subpath }}/pdf/BCM2837-ARM-Peripherals-Revised-V2-1.pdf)

Dalam PDF tersebut sudah disediakan cara berinteraksi untuk setiap komponen, dan
alamat dari register tersebut.

> Datasheet tersebut dibuat dari dokumen BCM2835 namun beberapa di-edit manual
untuk disesuaikan kepada BCM2837 (+ beberapa errata). Gambar di PDF mungkin
tidak akurat. {: .prompt-warning}

### Target

Kita akan membuat program yang bisa mengontrol GPIO, dan membuat LED berkedip.
Kita belum akan membuat interface yang bisa menampilkan tulisan, karena hal
tersebut cukup kompleks dan masih sulit untuk memastikan _correctness_-nya.
Untuk sekarang setidaknya kita ingin tahu apakah program kita berjalan dengan
benar.


## Implementasi

> Tutorial ini sebagian besar mengambil dari artikel wiki OSDev - Raspberry Pi
Bare Bones. Link [disini](https://wiki.osdev.org/Raspberry_Pi_Bare_Bones)

Buat folder project menggunakan `cargo init --bin --edition 2021`. Kita akan
membuat beberapa komponen dari program, dimulai dari entry point sampai API
untuk mengakses GPIO.

### Entry point

Di dalam `src/`, kita akan membuat entry point dari program kita dalam assembly,
dengan filename `boot.S`. CPU akan pertama kali mengeksekusi kode ini.

```
// AArch64 mode

// To keep this in the first portion of the binary.
.section ".text.boot"

// Make _start global.
.globl _start

// Entry point for the kernel. Registers:
// x0 -> 32 bit pointer to DTB in memory (primary core only) / 0 (secondary cores)
// x1 -> 0
// x2 -> 0
// x3 -> 0
// x4 -> 32 bit kernel entry point, _start location
_start:
    // https://forums.raspberrypi.com/viewtopic.php?t=273010
    // read cpu id, stop slave cores
    mrs     x1, mpidr_el1
    and     x1, x1, #3
    cbz     x1, 2f
    // cpu id > 0, stop
    b       halt
2:  // cpu id == 0

    // set stack before our code
    ldr     x5, =_start
    mov     sp, x5

    // clear bss
    ldr     x5, =__bss_start
    ldr     w6, =__bss_size
1:  cbz     w6, 2f
    str     xzr, [x5], #8
    sub     w6, w6, #1
    cbnz    w6, 1b

    // jump to C code, should not return
2:  bl      kernel_main

    // for failsafe, halt this core
halt:
    wfe
    b halt
```

Untuk penjelasan instruction sendiri bisa look-up sendiri lewat Google, disini
saya akan menjelaskan garis besar apa yang dilakukan.

#### Assembly Directive

Ada 2 _assembly directive_ di atas: `.section`, dan `.globl`. Tujuan _directive_
pertama untuk memunculkan _section_ `.text.boot` yang dimulai dari instruksi
pertama dibawahnya. Kedua, untuk memberitahu compiler bahwa `_start` adalah
sebuah symbol yang public. Nanti section dan symbol di atas akan berguna pada
saat proses `linking`, yang akan dijelaskan di bawah nanti.

#### Single-core only

Pertama, semua CPU akan menyala dan mengeksekusi program yang sama (program
kita). Agar tidak terjadi bentrok, kita mau "mematikan" CPU ID #1, #2, #3 dan
biarkan CPU 0 yang berjalan.

#### Stack Pointer

Kedua, kita mengatur posisi _stack pointer_ kita tepat di atas alamat instruksi
pertama kita, yang ditandai oleh symbol`_start`.

> Karena sistem stack di ARM itu arahnya "ke-atas" (saat _push_, value alamat di
`sp` akan dikurangi), makanya kita ambil posisi kita di atas alamat instruksi
pertama, biar tidak tiba-tiba menimpa instruksi selanjutnya.
{: .prompt-info}

#### Clear .bss

Ketiga, kita ingin meng-nol-kan segmen memori yang ditandai dengan `bss`. Segmen
`bss` nantinya akan ditempati oleh variabel-variabel yang _statically
allocated_, mirip seperti kita membuat variabel `static int my_value`. Jadi, ini
untuk memastikan bahwa variable static kita value-nya 0.

> "Segmen memori" disini sama saja dengan segmen program kita, karena nanti
semua program kita akan ditaruh ke memori dalam proses _booting_.
{: .prompt-info}

#### Jump to main function

Terakhir, kita akan _jump_ ke alamat yang ditandai `kernel_main`, yang nanti
kita akan implementasi.

Dari assembly di atas, ada beberapa symbol: `_start`, `__bss_start`,
`__bss_size`, `kernel_main`. Pada saat `linking process` nantinya, baru symbol
ini akan di-resolve dan diganti ke value yang sebenarnya.

Karena compilation Rust hanya melihat file yang di-"depend" oleh `main.rs`, maka
kita buat source file baru `rs` bernama `boot.rs` yang isinya:

```rust
core::arch::global_asm!(include_str!("boot.S"));
```
{: .file="boot.rs" }

### Main Function

Kita akan membuat main "entry-point" kita yang menggunakan kode Rust. Ingat,
program kita tidak akan bisa menggunakan library tambahan maupun syscall apapun,
maka kita tidak bisa menggunakan library `std`, hanya `core` saja. Kita akan
menambahkan _crate attribute_ `no_std` dan `no_main` karena _main function_ kita
akan dipanggil oleh assembly di atas.

File `main.rs` akan berisi sbb:

```rust
#![no_std]
#![no_main]

mod boot;

#[no_mangle]
extern "C" fn kernel_main() {
}


#[panic_handler]
fn on_panic(_info: &core::panic::PanicInfo) -> ! {
  loop {}
}

```
{: .file="main.rs" }

#### External Linkage dan no_mangle

`no_mangle` dan `extern "C"` di atas sangat penting untuk memastikan fungsi
`kernel_main` memiliki _external linkage_ dan nama symbolnya tidak _mangled_
(jadi tetap `kernel_main`, yang bisa dibaca oleh assembly yang kita buat di
atas).

> Secara default, fungsi yang di-compile Rust akan melewati proses _name
mangling_. Mudahnya, nama fungsi yang muncul setelah meng-compile
`kernel_main()` tidak akan menjadi `kernel_main`, tetapi seperti
`_ZN5osdev10main14kernel_main17h6443fc27a975a06bE`. Source file lain yang ingin
memanggil `kernel_main` harus menggunakan nama/symbol hasil _mangling_, atau
melewati proses [_name
mangling_](https://doc.rust-lang.org/rustc/symbol-mangling/index.html) yang
sama, agar linker bisa me-"nyambungkan" dengan benar.
{: .prompt-info}


#### Panic Handler

Rust sendiri memiliki _panic handler_ yang akan dipanggil apabila ada
_unrecoverable error_. Sayangnya, fitur ini tidak bisa langsung kita pakai. Kita
akan mematikan _default panic handler_ dan menggantinya di `main.rs` di fungsi
yang ditandai `#[panic_handler]`.

Tambahkan informasi berikut di `Cargo.toml`:

```rust

[profile.dev]
panic = "abort"

[profile.release]
panic = "abort"

```

Penjelasannya bisa dilihat
[disini](https://doc.rust-lang.org/nomicon/panic-handler.html) dan
[disini](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html).

### Implementasi GPIO

Mulai dari sini, kita bisa ngoding "hampir sepenuhnya" dalam Rust. Untuk
mengoperasikan GPIO kita harus:
- Memahami cara mengakses register yang mengontrol pin GPIO tersebut
- Memahami berada di region memory mana register tersebut berada.

Dari halaman 6 dari datasheet,

> Physical addresses range from 0x3F000000 to 0x3FFFFFFF for peripherals. The
bus addresses for peripherals are set up to map onto the peripheral bus address
range starting at 0x7E000000. Thus a peripheral advertised here at bus address
0x7Ennnnnn is available at physical address 0x3Fnnnnnn.

Dari kalimat pertama, kita dapat mengetahui _base address_ dari peripheral
dimulai dari `0x3F000000`. 

> Semua address yang ditunjukkan di dalam datasheet ditulis dalam format "bus
address" (alamat yang dipahami oleh VideoCore), jadi kita perlu berhati-hati
karena kita bekerja dalam CPU, bukan GPU. Contoh, register `GPSET0` ada di
alamat `0x7E20001C`, maka dalam CPU sebenarnya alamat tersebut adalah
`0x3F20001C`.
{: .prompt-warning}

#### MMIO

Kita akan mempersiapkan interface untuk menulis data ke dalam memori segmen
peripheral. Kita namakan MMIO (Memory mapped IO) karena CPU mengakses peripheral
melalui interface memori.

File `mmio.rs` berisi sbb:

```rust
// Each model has different base addresses.
static BASE_ADDR: u64 = 0x3F000000;

#[inline(always)]
pub fn write(addr: u64, data: u32) {
  unsafe { core::ptr::write_volatile((BASE_ADDR + addr) as *mut u32, data) }
}

#[inline(always)]
pub fn read(addr: u64) -> u32 {
  unsafe { core::ptr::read_volatile((BASE_ADDR + addr) as *mut u32) }
}
```

`write_volatile` dan `read_volatile` disini sangat penting untuk menghindari
_optimization_ yang bisa dilakukan oleh compiler. Karena value di dalam bagian
memori tersebut tidak sepenuhnya dikontrol oleh program kita, maka compiler
tidak boleh melakukan asumsi apapun terhadap pointer tersebut.

#### Kontrol GPIO

Untuk mengontrol GPIO, kita harus mengubah mode GPIO tersebut menjadi mode
_output_, baru kita bisa menyalakan output tersebut.

Mengacu ke halaman 90, ada 3 jenis register yang harus kita kontrol:
- `GPFSEL`: Mengatur mode GPIO. Kita akan mengubah mode GPIO menjadi mode output.
- `GPSET`: Menyalakan GPIO output.
- `GPCLR`: Mematikan GPIO output.

Untuk penjelasan `GPSET` dan `GPCLR` sepertinya sudah cukup jelas dalam
datasheet. Untuk `GPFSEL`, yang perlu diperhatikan adalah setiap GPIO diwakili oleh 3 bit.

```rust
use crate::io::mmio;

// Number of GPIOs
const NUM_GPIOS: u8 = 54;

// Registers
struct Reg;
#[allow(dead_code)]
impl Reg {
  const BASE: u64      = 0x0020_00_00;
  const GPFSEL0: u64   = Reg::BASE + 0x00; // GPIO Function Select 0
  const GPFSEL1: u64   = Reg::BASE + 0x04; // GPIO Function Select 1
  const GPFSEL2: u64   = Reg::BASE + 0x08; // GPIO Function Select 2
  const GPFSEL3: u64   = Reg::BASE + 0x0C; // GPIO Function Select 3
  const GPFSEL4: u64   = Reg::BASE + 0x10; // GPIO Function Select 4
  const GPFSEL5: u64   = Reg::BASE + 0x14; // GPIO Function Select 5
  // Each register represents floor(32bit / 3bit) = 10 GPIOs
  // bit 30-31 is reserved
  const GPFSEL_BANK: [u64; 6] = [Reg::GPFSEL0, Reg::GPFSEL1, Reg::GPFSEL2,
                                 Reg::GPFSEL3, Reg::GPFSEL4, Reg::GPFSEL5];

  const GPSET0: u64    = Reg::BASE + 0x1C; // GPIO Pin Output Set 0
  const GPSET1: u64    = Reg::BASE + 0x20; // GPIO Pin Output Set 1
  const GPCLR0: u64    = Reg::BASE + 0x28; // GPIO Pin Output Clear 0
  const GPCLR1: u64    = Reg::BASE + 0x2C; // GPIO Pin Output Clear 1
}

#[allow(dead_code)]
pub enum Function {
  Input,
  Output,
  Func0,
  Func1,
  Func2,
  Func3,
  Func4,
  Func5,
}

// Set function of GPIOs in which position the bit is set.
// For example, set_function(1 << 5 | 1 << 10, Function::Output)
// sets GPIO5 and GPIO10 as output.
pub fn set_function(mut gpios: u64, function: Function) {
  assert!(NUM_GPIOS as usize <= 10 * Reg::GPFSEL_BANK.len());

  // Make sure only 0..53 are set
  gpios = gpios & ((1 << NUM_GPIOS) - 1);
  let function_bits: u8 = {
    match function {
      Function::Input  => 0b000,
      Function::Output => 0b001,
      Function::Func0  => 0b100,
      Function::Func1  => 0b101,
      Function::Func2  => 0b110,
      Function::Func3  => 0b111,
      Function::Func4  => 0b011,
      Function::Func5  => 0b010,
    }
  };

  let mut gpfsel_val: [u32; Reg::GPFSEL_BANK.len()] =
    [0; Reg::GPFSEL_BANK.len()];
  for (idx, reg) in Reg::GPFSEL_BANK.iter().enumerate() {
    gpfsel_val[idx] = mmio::read(*reg);
  }
  
  for i in 0..(NUM_GPIOS - 1) {
    if gpios & (1 << i) != 0 {
      // Where to place the function bit
      let shift = (i % 10) * 3;
      let bank_idx = i / 10;
      // zero out the bits first
      gpfsel_val[bank_idx as usize] &= !((0b111 << shift) as u32);
      gpfsel_val[bank_idx as usize] |= (function_bits as u32) << shift;
    }
  }
  
  for (reg, val) in core::iter::zip(Reg::GPFSEL_BANK, gpfsel_val) {
    mmio::write(reg, val);
  }
}

// Set the output of GPIO in which position the bit is set.
// For example, output_set(1 << 5 | 1 << 10) sets GPIO 5, and 10.
pub fn output_set(mut gpios: u64) {
  // Make sure only 0..53 is set
  gpios = gpios & ((1 << NUM_GPIOS) - 1);
  let gpios_0: u32 = gpios as u32;
  let gpios_1: u32 = (gpios >> 32) as u32;
  mmio::write(Reg::GPSET0, gpios_0);
  mmio::write(Reg::GPSET1, gpios_1);
}

// Set the output of GPIO in which position the bit is set.
// For example, output_set(1 << 5 | 1 << 10) clears GPIO 5, and 10.
pub fn output_clear(mut gpios: u64) {
  // Make sure only 0..53 is set
  gpios = gpios & ((1 << NUM_GPIOS) - 1);
  let gpios_0: u32 = gpios as u32;
  let gpios_1: u32 = (gpios >> 32) as u32;
  mmio::write(Reg::GPCLR0, gpios_0);
  mmio::write(Reg::GPCLR1, gpios_1);
}
```

Saya membuat fungsi diatas yang menerima 1 value `u64` yang mewakili 1 bit
sebagai 1 GPIO. Contohnya, untuk mengontrol GPIO4, saya akan memasang value
`0b10000` (GPIO dimulai dari 0).

#### "Sleep function"

Karena kita ingin membuat _blinking LED_, maka kita perlu sesuatu untuk
men-"delay" program kita berjalan. Kalau pemrograman biasa, biasanya kita sudah
diberikan system call `sleep` yang di dalamnya sudah dibuat dengan cukup akurat
menggunakan hardware timer dan interrupt. Dalam implementasi kita, belum ada
yang bisa melakukan hal tersebut. Jadi untuk sekarang simplenya kita cukup
membuat for loop yang menghitung 1 sampai N saja.

```rust
// Loop <delay> times in a way that the compiler won't optimize away
pub fn sleep(count: i32) {
  core::hint::black_box((|mut cnt: i32| while cnt > 0 { cnt -= 1; } ) (count));
}
```

Kita perlu menghindari optimisasi compiler disini, karena compiler bisa saja
melihat program kita sebenarnya tidak melakukan apa-apa (hanya loop tanpa
hasil), kemudian meng-skip kode tersebut Rust menyediakan fungsi `black_box`
untuk membuat compiler-nya tidak melakukan optimisasi appun.

### Menyusun yang sudah dibangun

Kita sudah melengkapi apa yang dibutuhkan untuk _blinking LED_. Sekarang kita
tinggal menyusunnya di main function yang kita buat sebelumnya.

Untuk percobaan kali ini, saya akan menghubungkan GPIO4 dengan LED. Saya
menggunakan GPIO Extension Board agar lebih mudah koneksinya.

![Desktop View](img/gpio.jpeg)

> Jika ingin menggunakan GPIO lain, perlu diketahui dalam Raspberry Pi ada 2
sistem penomoran GPIO yang berbeda: BCM dan GPIO. Yang dipahami oleh SoC adalah
penomoran BCM. Sebagai contoh, di website [pinout.xyz](https://pinout.xyz)
tulisan "GPIO X" yang diwarnai putih, X-nya menggunakan penomoran BCM
{: .prompt-warning }

Kemudian, pada file `main.rs`, kita akan menaruh logic-nya:

```rust
#[no_mangle]
extern "C" fn kernel_main() {
  gpio::set_function(1 << 4, gpio::Function::Output);
  loop {
    gpio::output_set(1 << 4);
    synchronization::sleep(500_000);
    gpio::output_clear(1 << 4);
    synchronization::sleep(500_000);
  }
}
```

Logic di atas cukup simple berkat bantuan interface yang kita buat. Pertama,
kita mengubah mode GPIO4 menjadi mode output, kemudian kita nyalakan dan matikan
output tersebut dengan jeda menggunakan `delay(500_000)`.

## Build

Untuk build project ini, tidak bisa langsung menjalankan `cargo build` karena
kita akan build untuk hardware tanpa OS apapun (bare metal). Kita perlu
menentukan sendiri struktur binary program kita. Sebelumnya kita menyinggung
linking process di beberapa bagian, sekarang kita akan mengatur _linking process_ tersebut.

### Linking

Sebenarnya yang terjadi dalam hasil kompilasi, biasanya source file akan
dikompilasi menjadi _object file_. _Object file_ belum tentu bisa dijalankan,
karena bisa saja ada symbol yang belum di-resolve. Sebagai contoh, di atas kita
membuat `boot.S` yang berisi instruksi untuk jump ke address yang dilabeli
`kernel_main`. `boot.S` sendiri belum tahu apa maksud dari `kernel_main`, dan
`main.rs` hanya membuat fungsi `kernel_main` tanpa tahu siapa  yang
menggunakannya. _Linking process_ inilah yang menghubungkan symbol `kernel_main`
tersebut.

Linker juga bertanggung jawab mengatur isi struktur program binary akhir kita, seperti
mengatur section `.text.boot` harus berada di paling atas (ini penting agar CPU bisa eksekusi),
dan section sisanya berada di bawahnya.

Perlu diketahui juga bahwa CPU Raspberry Pi mengeksekusi instruksi pertama pada
alamat memory `0x8000` (untuk 32-bit), atau `0x80000` untuk (64-bit). Lebih
lengkapnya bisa dilihat di [post Stack Overflow
berikut](https://raspberrypi.stackexchange.com/questions/10442/what-is-the-boot-sequence).

Berikut adalah linker script yang akan kita pakai, kita namakan
`aarch64-raspi3b.ld`.

```
ENTRY(_start)

SECTIONS
{
    /* Starts at LOADER_ADDR. */
    . = 0x80000;
    /* For arm32, use . = 0x8000; */
    __start = .;
    __text_start = .;
    .text :
    {
        KEEP(*(.text.boot))
        *(.text)
    }
    . = ALIGN(4096); /* align to page size */
    __text_end = .;

    __rodata_start = .;
    .rodata :
    {
        *(.rodata*)
    }
    . = ALIGN(4096); /* align to page size */
    __rodata_end = .;

    __data_start = .;
    .data :
    {
        *(.data)
    }
    . = ALIGN(4096); /* align to page size */
    __data_end = .;

    __bss_start = .;
    .bss :
    {
        bss = .;
        *(.bss)
    }
    . = ALIGN(4096); /* align to page size */
    __bss_end = .;
    __bss_size = __bss_end - __bss_start;
    __end = .;
}
```

Script di atas diambil dari Wiki OSDev, dan disana ada [penjelasan lebih
detail](https://wiki.osdev.org/Raspberry_Pi_Bare_Bones#Linking_the_Kernel)
tentang setiap perintahnya. Intinya, section `.text.boot` akan ditaruh tepat di
alamat `0x80000` dan sisanya akan mengikuti, termasuk alamat variabel dan
function akan ditaruh setelah `0x80000`.

### Cross Compile

Semua sudah siap, sekarang kita hanya tinggal compile. Sayangnya, kita harus
melakukan step khusus untuk compile, karena target hardware kita bukan komputer
kita sendiri, melainkan sebuah sistem AArch64 yang berjalan tanpa OS (bare
metal). Kita harus mengubah target kita ke `aarch64-unknown-none` (Platform
AArch64 dengan vendor `unknown` dan OS `none`).

Siapkan toolchain yang dibutuhkan untuk cross compile ke target berikut:

```shell
rustup target add aarch64-unknown-none
cargo install cargo-binutils
rustup component add llvm-tools
```

Kemudian, buat file `.cargo/config.toml` dan sisipkan konfigurasi berikut:

```
[build]
target = "aarch64-unknown-none"
rustflags = ["-C", "link-arg=-Tsrc/aarch64-raspi3b.ld"]
```

Konfigurasi di atas memastikan bahwa compile akan dilakukan ke target
`aarch64-unknown-none` dengan linker script `src/aarch64-raspi3b.ld`. Silakan
ubah file linker scriptnya apabila berbeda.

Semua sudah lengkap, tinggal dijalankan saja build seperti biasa:

```shell 
> cargo build

Compiling osdev v0.0.1 (/Users/firmanhp/Code/firmanhp.github.io/references/2024-10-04-osdev)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.72s
```

Hasil kompilasi akan berbentuk ELF format yang belum langsung bisa dijalankan di
mesin.

```shell
file target/aarch64-unknown-none/debug/osdev
target/aarch64-unknown-none/debug/osdev: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), statically linked, with debug_info, not stripped
```

ELF sendiri bisa dibilang sebagai format binary dengan tambahan metadata. Untuk
menghapus metadata agar isi binary-nya hanya instruksi dan data saja, kita bisa
menggunakan `objcopy`.

```shell
> cargo objcopy -- -O binary osdev.img
> file osdev.img
osdev.img: data
```

## Verifikasi/Sanity check

Debugging bare metal program tidaklah mudah karena kita tidak ada feedback yang
jelas, karena kitapun belum implementasi sistem serial maupun display yang bisa
menampilkan sesuatu.

Ada sedikit tips yang bisa digunakan untuk memastikan apakah binary akan
berjalan dengan benar atau bukan, kita bisa melakukan sedikit inspeksi pada ELF
file yang baru kita buat menggunakan `objdump`. Karena binary hasil kompilasi
Rust cukup besar untuk source yang kecil ini (karena _somehow_ ada data yang
dipakai mungkin untuk exception handling?), kita taruh saja hasil outputnya ke
dalam file.

```shell
objdump -dt target/aarch64-unknown-none/debug/osdev > objdump_out
```

Jika dilihat hasil outputnya, harusnya symbol `_start` kita berada di alamat
`0x80000` seperti berikut:

```
Disassembly of section .text:

0000000000080000 <_start>:
   80000: d53800a1     	mrs	x1, MPIDR_EL1
   80004: 92400421     	and	x1, x1, #0x3
   80008: b4000041     	cbz	x1, 0x80010 <_start+0x10>
   8000c: 1400000a     	b	0x80034 <halt>
   80010: 58000185     	ldr	x5, 0x80040 <$d.2>
   80014: 910000bf     	mov	sp, x5
   80018: 58000185     	ldr	x5, 0x80048 <$d.2+0x8>
   8001c: 180001a6     	ldr	w6, 0x80050 <$d.2+0x10>
   80020: 34000086     	cbz	w6, 0x80030 <_start+0x30>
   80024: f80084bf     	str	xzr, [x5], #8
   80028: 510004c6     	sub	w6, w6, #1
   8002c: 35ffffa6     	cbnz	w6, 0x80020 <_start+0x20>
   80030: 94000460     	bl	0x811b0 <kernel_main>
...
```

Kita bisa lihat juga instruksi di dalamnya yang sama seperti isi kode `boot.S`
kita. Artinya, kita cukup yakin bahwa di atas akan menjadi instruksi pertama
yang dieksekusi oleh CPU kita. Apabila alamat `0x80000` diisi data yang lain,
artinya hasil kompilasi kita tidak benar.

Dari hasil tersebut kita juga bisa lihat hasil _name mangling_ Rust, dan section
yang kita singgung di dalam linker script kita: `.rodata`, `.data`, `.bss`.

## Menjalankan di Mesin

Misalkan binary (tanpa metadata ELF) kita bernama `osdev.img`, kita akan
pindahkan file tersebut ke SD Card mesin kita. Asumsi kita sudah pernah
menginstall Linux sebelumnya ke dalam SD Card tersebut, kita cukup mengganti
file `kernel8.img` di dalam partisi `bootfs`, atau tetap menggunakan nama
`osdev.img`, dan mengatur `config.txt` dan menambahkan konfigurasi berikut:

```
# For more options and information see
# http://rptl.io/configtxt
# Some settings may impact device functionality. See link above for details

kernel=osdev.img
```

Eject SD cardnya, masukkan ke Raspberry Pi, dan nyalakan!

![Desktop View](img/blinking.gif)
_LED blinking!_


## Conclusion

Sampel source code bisa dilihat
[disini](https://github.com/firmanhp/firmanhp.github.io/tree/main/references/2024-10-04-osdev).

Kita baru saja membuat program yang berjalan di atas bare metal Raspberry Pi.
Cara di atas bisa saja diadaptasi untuk platform yang lain, tentunya dengan
memahami hardware yang dituju.

Selanjutnya mungkin bisa dikembangkan lagi menjadi operating system yang
sesungguhnya (bisa menjalankan process, mengakses filesystem, menggunakan
keyboard/mouse, dll), tentunya _step-by-step_. Dari sini kita jadi memahami
bahwa operating system adalah project yang sangat besar dan memakan waktu yang
lama, dan perlu kerjasama dari banyak orang, terutama vendor untuk
mengimplementasikan driver hardware mereka.

## Referensi

- [OSDev Wiki Raspberry Pi Bare
  Bones](https://wiki.osdev.org/Raspberry_Pi_Bare_Bones)
- [BCM2837 datasheet + errata
  PDF](https://github.com/raspberrypi/documentation/issues/325#issuecomment-379651504)
- [Raspberry Pi 3 Model
  B](https://www.raspberrypi.com/products/raspberry-pi-3-model-b/)
- [What is the boot sequence?](https://raspberrypi.stackexchange.com/questions/10442/what-is-the-boot-sequence)