---
title: "Raspberry Pi Bare Metal: UART"
date: 2024-10-13 18:00:00 +0800
categories: [OS]
tags: [qemu, systems-programming, rust, raspberry-pi, indonesia]
description: "(Post in Indonesian) Implementasi Serial UART dalam Raspberry Pi"
media_subpath: /assets/2024-10-13-id-raspi-bare-metal-uart
image:
  path: img/thumbnail.jpeg
  alt: Saat terkoneksi dengan UART.
render_with_liquid: true
---

## Intro

Sebelumnya kita sudah membahas cara membuat program bare metal dalam Raspberry
Pi 3 dan membuat pin GPIOnya bekerja. Sekarang, kita akan mempersiapkan program
kita untuk bisa dikembangkan lagi dengan berbagai macam fitur. Salah satu
persiapan tersebut adalah membuat tampilan output.

Tentu sudah jelas dengan memiliki tampilan output ini akan mempermudah kita
dalam proses debugging. Namun, tidak semua fitur tampilan output mudah untuk
diimplementasi. Kalau kita ingin membuat output melalui tampilan di monitor,
maka kita harus implementasi driver GPU-nya, mengirim frame buffer, kemudian
baru muncul tulisan di monitor kita. Lalu apa metode output yang bisa kita
implementasi dengan mudah?

> Penjelasan di bawah akan menggunakan Raspberry Pi 3 Model B. Datasheet BCM2837
bisa dicek [disini]({{ site.baseurl
}}/assets/2024-10-05-id-raspi-bare-metal-rust/pdf/BCM2837-ARM-Peripherals-Revised-V2-1.pdf).
{: .prompt-warning }


## UART

[UART](https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter)
(Universal Asynchronous Receiver-Transmitter) merupakan _peripheral device_ yang
digunakan untuk komunikasi serial. Komunikasi "serial" disini maksudnya adalah
kita mengirim data bit-per-bit.

![Desktop View](img/Serial_and_Parallel_Data_Transmission.jpg)
_Contoh ilustrasi komunikasi serial. Diambil dari
[Wikipedia](https://en.wikipedia.org/wiki/Serial_communication)._

UART sendiri memiliki _sequence_ khusus yang mana 1 bundel data (_frame_)
mengandung beberapa komponen, seperti _start bit_, _data_, _parity bit_, dan
_stop bit_. Komponen tersebut ada yang optional, dan ada yang harus dipakai.
Untuk selengkapnya bisa dicek di Wikipedia.

![Desktop View](img/UART-signal.jpg)
_Contoh ilustrasi komunikasi serial. Diambil dari
[Wikipedia](https://en.wikipedia.org/wikiUniversal_asynchronous_receiver-transmitter)._

Komunikasi UART memiliki _baud rate_, bisa dibilang _baud rate_ ini adalah
kecepatan transmisinya. Dua subjek yang berkomunikasi melalui UART harus
memiliki _baud rate_ yang sama.

Kali ini, kita hanya akan mengoperasikan controllernya saja yang sudah embedded
dalam SoC Raspberry Pi.

### Verifikasi

Ada dua cara untuk memverifikasi cara kita mengoperasikan komponen UART: Melalui
emulator (QEMU) atau menggunakan USB UART converter yang compatible dengan
Raspberry Pi. 

#### Menggunakan QEMU

[QEMU](https://www.qemu.org) merupakan salah satu tool emulator/virtualization
open source yang bisa melakukan emulasi untuk berbagai macam sistem, termasuk
Raspberry Pi 3. QEMU sendiri akan mempersiapkan emulasi dari berbagai macam
peripheral termasuk UART yang akan kita gunakan.

Apabila sudah menginstall QEMU di Linux/MacOS, cukup jalankan QEMU dengan
parameter `-kernel` mengarah ke binary ELF hasil compilenya.

```shell
qemu-system-aarch64 \
  -nographic \
  -M raspi3b \
  -kernel target/aarch64-unknown-none/debug/osdev
```

Kelebihannya adalah kita tidak perlu bolak-balik memindahkan image untuk
debugging. Kelemahannya (IMO) kita tidak bisa mereplikasi kondisi asli dari
komunikasi serial, bisa saja berhasil di QEMU, namun gagal di koneksi fisik
karena berbagai hal seperti _clock_ yang tidak cocok.

#### Menggunakan USB UART converter

Kita membutuhkan alat khusus USB UART converter yang compatible dengan Raspberry
Pi. Saya sendiri menggunakan Waveshare FT232 USB UART Board (bukan sponsor).
Nantinya pin RXD (receiver) dari board ini akan dikoneksikan dengan pin TXD
(transmitter) dari Raspberry Pi, dan sebaliknya.

Board lain bisa digunakan, asal memang compatible dengan Raspberry Pi.

![Desktop View](img/ft232.jpg)
_USB UART converter yang saya gunakan._

Untuk software, bisa menggunakan PuTTY (Windows), atau GNU screen, atau pyserial
(module dari Python). Kita juga harus menentukan _baud rate_ yang harus sama
dengan baud rate yang digunakan oleh Raspberry Pi, biasanya kita menggunakan
_baud rate_ 115200bps.

Kelebihannya adalah kita bisa memastikan apakah komponen UART kita bekerja
dengan baik, dan kekurangannya agak sulit untuk debugging apabila clock/baud
ratenya salah.

## Target

Dari datasheet, ada 2 komponen UART yang disediakan BCM2837:
- Mini UART
- PL011 UART

Apabila kita menggunakan Linux di Raspberry Pi, UART yang di-expose ke pin GPIO
adalah MIni UART, sedangkan PL011 UART akan sepenuhnya diambil oleh _bluetooth
controller_. Sayangnya, Mini UART memiliki **clock yang terhubung ke core
clock**. Artinya, apabila core frequency kita berubah, maka [baud ratenya
berubah](https://www.raspberrypi.com/documentation/computers/configuration.html#mini-uart-and-cpu-core-frequency). 

PL011 UART menggunakan clock yang terhubung ke clock khusus yang tidak berubah,
karena kita belum menggunakan bluetooth, maka kita akan menggunakan UART ini.

Program kita akan mengoperasikan PL011 UART dan memiliki fungsi `puts`, `putc`,
`getc` untuk meng-output karakter maupun string ke UART. Kita juga akan
mengimplementasi Trait `core::fmt::Write` agar kita bisa menggunakan macro Rust
`write!` dan `writeln!` yang memiliki fitur _formatting_.

Agar lebih simple, kita hanya akan membuat input output yang simple. Tidak ada
parity bit check, dan tidak menggunakan interrupt (menggunakan polling saja).

## Implementasi

Selain mengatur konfigurasi PL011 UART, kita juga harus mengatur konfigurasi
GPIO yang akan digunakan sebagai transmitter/receiver.

### Konfigurasi GPIO

Dari [pinout.xyz](pinout.xyz), bisa dilihat Raspberry Pi menghubungkan GPIO 14
dan 15 ke UART TX/RX apabila GPIO tersebut dikonfigurasi ke FUNC0/ALT0 (bisa
dicek [disini](https://elinux.org/RPi_BCM2835_GPIOs)). Dari tutorial sebelumnya
kita sudah memiliki fungsi untuk mengatur function GPIO.

```rust
// Func0 is TXD0/RXD0
gpio::set_function((1 << 14) | (1 << 15), gpio::Function::Func0);
```

Kita juga harus mengatur pull up/down dari GPIO. Konfigurasi tersebut bisa
diatur melalui dua buah register: GPPUD dan GPPUDCLKn. Dari datasheet juga
dijelaskan bagaimana cara mengubah mode pull dari GPIO:
1. Write ke GPPUD untuk mode yang diinginkan
2. Sleep 150 cycle
3. Nyalakan bit di GPPUDCLK0/1 sesuai untuk GPIO mana yang ingin diubah
4. Sleep 150 cycle
5. Hapus isi register GPPUD (set bit ke 0)
6. Hapus isi GPPUDCLK0/1 (set bit ke 0)

```rust
// Registers
struct Reg;
impl Reg {
  const BASE: u64 = 0x0020_00_00;

  const GPPUD: u64 = Reg::BASE + 0x94; // GPIO Pin Pull-up/down Enable
  const GPPUDCLK0: u64 = Reg::BASE + 0x98; // GPIO Pin Pull-up/down Enable Clock 0
  const GPPUDCLK1: u64 = Reg::BASE + 0x9C; // GPIO Pin Pull-up/down Enable Clock 1
}

// Pull up/down control mode.
pub enum PullMode {
  // Off – disable pull-up/down
  Disabled,
  // Enable Pull Down control
  PullDown,
  // Enable Pull Up control
  PullUp,
}

// Set pull mode for GPIOs 0..(MAX_GPIOs - 1) based on bit.
pub fn set_pull_mode(mut gpios: u64, mode: PullMode) {
  // Make sure only 0..53 are set
  gpios = gpios & ((1 << NUM_GPIOS) - 1);
  let gpios_0: u32 = gpios as u32;
  let gpios_1: u32 = (gpios >> 32) as u32;

  // Write to GPPUD to set the required control signal
  match mode {
    PullMode::Disabled => mmio::write(Reg::GPPUD, 0x00),
    PullMode::PullDown => mmio::write(Reg::GPPUD, 0x01),
    PullMode::PullUp => mmio::write(Reg::GPPUD, 0x10),
  }
  // Wait 150 cycles – this provides the required set-up time for the control signal
  synchronization::sleep(150);
  // Write to GPPUDCLK0/1 to clock the control signal into the GPIO pads
  // you wish to modify – NOTE only the pads which receive a clock will be
  // modified, all others will retain their previous state
  mmio::write(Reg::GPPUDCLK0, gpios_0);
  mmio::write(Reg::GPPUDCLK1, gpios_1);
  // Wait 150 cycles – this provides the required hold time for the control signal
  synchronization::sleep(150);

  // Write to GPPUD to remove the control signal
  mmio::write(Reg::GPPUD, 0x00);
  // Write to GPPUDCLK0/1 to remove the clock
  mmio::write(Reg::GPPUDCLK0, 0x00);
  mmio::write(Reg::GPPUDCLK1, 0x00);
}
```

Kita ingin mematikan mode pull up/down untuk pin GPIO14 dan 15.

```rust
// Disable pull up/down for GPIO pin 14, 15.
gpio::set_pull_mode((1 << 14) | (1 << 15), gpio::PullMode::Disabled);
```

### Konfigurasi UART

Ada beberapa register yang akan kita operasikan untuk PL011 UART. Spesifikasi
bisa dilihat dimulai dari halaman 175 dari datasheet. Register tersebut adalah:

- `CR` (Control): Enable/disable UART termasuk beberapa sistem di dalamnya.
- `ICR` (Interrupt Clear): Menghapus interrupt dari UART.
- `LCRH` (Line control): Mengatur spesifikasi frame yang akan dikirim/diterima,
  seperti parity bit, berapa bit dalam datanya, dan lain-lain.
- `IMSC` (Interrupt mask control): Mengatur interrupt mana saja yang di-mask
  (agar CPU tidak meng-handle interrupt-nya)
- `FR` (Flag): Menunjukkan kondisi _queue_ dari transmitter/receiver data,
  seperti queue full, queue empty.
- `DR` (Data): Tempat kita mengirim dan membaca data, ada beberapa bit yang
  menjadi informasi tentang data yang diterima.

> Ada 2 lagi yang penting, yaitu `IBRD`/`FBRD` (Integer/fractional baud rate
> divisor). 2 Register ini menentukan baud rate dari UART. Perhitungan baud rate
> sebenarnya menggunakan base clock yang mana untuk mencari frekuensinya harus
> menggunakan protokol mailbox (yang belum dibahas). Berdasarkan pengalaman
> pribadi, apabila 2 register ini tidak diatur, maka _by default_ UART bisa
> bekerja menggunakan 115200bps. **Kita tidak akan mengatur 2 register ini
> dulu.**
{: .prompt-warning }

#### Inisialisasi

Kita akan mengatur konfigurasi UART step-by-step:
1. Matikan fungsi UART terlebih dahulu melalui `CR`.
2. Hapus interrupt yang ada melalui `ICR`.
3. Atur spesifikasi data melalui `LCRH`
   - Aktifkan queue agar UART bisa menerima lebih dari 1 data
   - Gunakan 1 stop bit
   - Matikan parity bit
   - Kita mengirim/menerima data sebesar 8 bit.
4. Mask interrupt (Kita tidak punya interrupt handler) melalui `IMSC`
5. Aktifkan UART, termasuk receiver dan transmitter.

```rust
struct Reg;
impl Reg {
  const PL011_BASE: u64 = 0x0020_10_00;
  const PL011_DR: u64 = Reg::PL011_BASE + 0x00; // Data Register
  const PL011_FR: u64 = Reg::PL011_BASE + 0x18; // Flag register
  const PL011_IBRD: u64 = Reg::PL011_BASE + 0x24; // Integer Baud rate divisor
  const PL011_FBRD: u64 = Reg::PL011_BASE + 0x28; // Fractional Baud rate divisor
  const PL011_LCRH: u64 = Reg::PL011_BASE + 0x2C; // Line Control register
  const PL011_CR: u64 = Reg::PL011_BASE + 0x30; // Control register
  const PL011_IFLS: u64 = Reg::PL011_BASE + 0x34; // Interupt FIFO Level Select Register
  const PL011_IMSC: u64 = Reg::PL011_BASE + 0x38; // Interupt Mask Set Clear Register
  const PL011_RIS: u64 = Reg::PL011_BASE + 0x3C; // Raw Interupt Status Register
  const PL011_MIS: u64 = Reg::PL011_BASE + 0x40; // Masked Interupt Status Register
  const PL011_ICR: u64 = Reg::PL011_BASE + 0x44; // Interupt Clear Register
  const PL011_DMACR: u64 = Reg::PL011_BASE + 0x48; // DMA Control Register
  const PL011_ITCR: u64 = Reg::PL011_BASE + 0x80; // Test Control register
  const PL011_ITIP: u64 = Reg::PL011_BASE + 0x84; // Integration test input reg
  const PL011_ITOP: u64 = Reg::PL011_BASE + 0x88; // Integration test output reg
  const PL011_TDR: u64 = Reg::PL011_BASE + 0x8C; // Test Data reg
}

struct Bit;
impl Bit {
  // PL011_CR control
  const PL011_CR_UARTEN: u32 = 1 << 0;
  const PL011_CR_LBE: u32 = 1 << 7;
  const PL011_CR_TXE: u32 = 1 << 8;
  const PL011_CR_RXE: u32 = 1 << 9;
  const PL011_CR_RTS: u32 = 1 << 11;
  const PL011_CR_RTSEN: u32 = 1 << 14;
  const PL011_CR_CTSEN: u32 = 1 << 15;

  // PL011_LCRH control
  const PL011_LCRH_BRK: u32 = 1 << 0;
  const PL011_LCRH_PEN: u32 = 1 << 1;
  const PL011_LCRH_EPS: u32 = 1 << 2;
  const PL011_LCRH_STP2: u32 = 1 << 3;
  const PL011_LCRH_FEN: u32 = 1 << 4;
  const PL011_LCRH_WLEN_5: u32 = 0b00 << 5;
  const PL011_LCRH_WLEN_6: u32 = 0b01 << 5;
  const PL011_LCRH_WLEN_7: u32 = 0b10 << 5;
  const PL011_LCRH_WLEN_8: u32 = 0b11 << 5;
  const PL011_LCRH_WLEN_SPS: u32 = 1 << 7;

  // PL011_ICR control
  const PL011_ICR_CTSMIC: u32 = 1 << 1;
  const PL011_ICR_RXIC: u32 = 1 << 4;
  const PL011_ICR_TXIC: u32 = 1 << 5;
  const PL011_ICR_RTIC: u32 = 1 << 6;
  const PL011_ICR_FEIC: u32 = 1 << 7;
  const PL011_ICR_PEIC: u32 = 1 << 8;
  const PL011_ICR_BEIC: u32 = 1 << 9;
  const PL011_ICR_OEIC: u32 = 1 << 10;
  // Clear all
  const PL011_ICR_ALL: u32 = Bit::PL011_ICR_CTSMIC
    | Bit::PL011_ICR_RXIC
    | Bit::PL011_ICR_TXIC
    | Bit::PL011_ICR_RTIC
    | Bit::PL011_ICR_FEIC
    | Bit::PL011_ICR_PEIC
    | Bit::PL011_ICR_BEIC
    | Bit::PL011_ICR_OEIC;

  // PL011_IMSC control
  const PL011_IMSC_CTSMIM: u32 = 1 << 1;
  const PL011_IMSC_RXIM: u32 = 1 << 4;
  const PL011_IMSC_TXIM: u32 = 1 << 5;
  const PL011_IMSC_RTIM: u32 = 1 << 6;
  const PL011_IMSC_FEIM: u32 = 1 << 7;
  const PL011_IMSC_PEIM: u32 = 1 << 8;
  const PL011_IMSC_BEIM: u32 = 1 << 9;
  const PL011_IMSC_OEIM: u32 = 1 << 10;
  // Mask all
  const PL011_IMSC_ALL: u32 = Bit::PL011_IMSC_CTSMIM
    | Bit::PL011_IMSC_RXIM
    | Bit::PL011_IMSC_TXIM
    | Bit::PL011_IMSC_RTIM
    | Bit::PL011_IMSC_FEIM
    | Bit::PL011_IMSC_PEIM
    | Bit::PL011_IMSC_BEIM
    | Bit::PL011_IMSC_OEIM;

  // PL011_FR control
  const PL011_FR_CTS: u32 = 1 << 0;
  const PL011_FR_BUSY: u32 = 1 << 3;
  const PL011_FR_RXFE: u32 = 1 << 4;
  const PL011_FR_TXFF: u32 = 1 << 5;
  const PL011_FR_RXFF: u32 = 1 << 6;
  const PL011_FR_TXFE: u32 = 1 << 7;
}

pub fn pl011_init() {
  // Func0 is TXD0/RXD0
  gpio::set_function((1 << 14) | (1 << 15), gpio::Function::Func0);
  // Disable pull up/down for GPIO pin 14, 15.
  gpio::set_pull_mode((1 << 14) | (1 << 15), gpio::PullMode::Disabled);
  // Disable everything first
  mmio::write(Reg::PL011_CR, 0x00);
  // Clear pending interrupts
  mmio::write(Reg::PL011_ICR, Bit::PL011_ICR_ALL);

  // Enable FIFO
  // 8 bit data transmission (1 stop bit, no parity).
  mmio::write(
    Reg::PL011_LCRH,
    Bit::PL011_LCRH_FEN | Bit::PL011_LCRH_WLEN_8,
  );
  // Mask all interrupts.
  mmio::write(Reg::PL011_IMSC, Bit::PL011_IMSC_ALL);
  // Enable UART, receive and transfer.
  mmio::write(
    Reg::PL011_CR,
    Bit::PL011_CR_UARTEN | Bit::PL011_CR_RXE | Bit::PL011_CR_TXE,
  );
}
```

### Operasi input/output

Kita akan implementasi fungsi berikut menggunakan UART:
- `putc` (Put character)
- `puts` (Put string)
- `getc` (Get character)

#### putc (Put character)

Untuk `putc`, langkah yang harus kita lakukan adalah
1. Tunggu sampai queue transmisi sudah tidak penuh melalui register `FR` (Hal
   ini dinamakan _polling_).
2. Tulis karakter ke dalam register `DR`

```rust
pub fn pl011_putc(c: u8) {
  // Wait for TX FIFO not empty
  while mmio::read(Reg::PL011_FR) & Bit::PL011_FR_TXFF != 0 {}
  mmio::write(Reg::PL011_DR, c as u32);
}
```

#### puts (Put string)

`puts` sama saja seperti melakukan `putc` untuk setiap karakternya.

```rust
pub fn pl011_puts(s: &str) {
  for c in s.as_bytes() {
    pl011_putc(*c);
  }
}
```

#### getc (Get character)

Untuk `getc`, kita harus:
1. Menunggu sampai queue transmisi sudah tidak kosong melalui register `FR`
2. Baca karakter dari register `DR`.

```rust
pub fn pl011_getc() -> u8 {
  // Wait for any inputs
  while mmio::read(Reg::PL011_FR) & Bit::PL011_FR_RXFE != 0 {}
  return (mmio::read(Reg::PL011_DR) & 0xFF) as u8;
}
```

## Testing

Kita akan mencoba membuat program "Hello world" menggunakan UART yang baru kita
buat. Selain itu, kita juga akan test fungsi `getc` kita dengan membuat program
echo.

```rust
fn test_uart() {
  uart::pl011_init();
  uart::pl011_puts("UART TEST\r\n");
  uart::pl011_puts("Hello, kernel World from Rust!\r\n");

  loop {
    uart::pl011_putc(uart::pl011_getc());
  }
}


#[no_mangle]
extern "C" fn kernel_main() {
  test_uart();
}
```

Compile programnya, dan jalankan.

### Jalankan melalui QEMU

Test melalui QEMU bisa dilakukan dengan binary ELF hasil kompilasi:

```shell
qemu-system-aarch64 \
  -nographic \
  -M raspi3b \
  -kernel target/aarch64-unknown-none/debug/osdev

UART TEST
Hello, kernel World from Rust!
```

Untuk keluar dari QEMU, tekan CTRL+A kemudian tekan X.

### Jalankan menggunakan USB UART

Untuk USB UART, saya menggunakan module Python 3 `pyserial`. Bisa juga
menggunakan PuTTY atau GNU Screen. Silakan menyesuaikan asal yang penting baud
ratenya 115200bps.

Pastikan pin TXD dari USB UART terkoneksi ke pin RXD dari Raspberry Pi, dan
sebaliknya. Jangan lupa juga hubungkan pin GND (ground).

```shell
python3 -m serial --eol LF - 115200

--- Available ports:
---  1: /dev/cu.Bluetooth-Incoming-Port 'n/a'
---  2: /dev/cu.usbserial-AB0MN1QF 'FT232R USB UART'
---  3: /dev/cu.wlan-debug   'n/a'
--- Enter port index or full name: 2
--- Miniterm on /dev/cu.usbserial-AB0MN1QF  115200,8,N,1 ---
--- Quit: Ctrl+] | Menu: Ctrl+T | Help: Ctrl+T followed by Ctrl+H ---
UART TEST
Hello, kernel World from Rust!

```

Apabila yang muncul adalah karakter tidak jelas (selamat debugging!), mungkin
cek kabelnya, atau coba baud rate yang lain yang umum: `9600`, `19200`, `38400`,
`57600`, ...

## Formatted output

Kita kadang perlu membuat output yang support formatting, seperti print angka
dari integer, atau hex. Rust memiliki support ini melalui macro `core::write!`
dan `core::writeln!`. Untuk menambahkan support ini ke UART kita, kita cukup
membuat implementasi dari Trait `core::fmt::Write`.

```rust
pub struct UartPl011;
impl core::fmt::Write for UartPl011 {
  fn write_str(&mut self, s: &str) -> core::fmt::Result {
    pl011_puts(s);
    Ok(())
  }
}
```

Dan macro sudah langsung bisa digunakan. Namun, macro di atas akan memberikan
return `Result`, yang mana terkadang Rust terlalu strict dan menyuruh kita
menggunakan `Result`-nya. Hal ini bisa diatasi dengan membuat macro tambahan.

```rust
#[macro_export]
macro_rules! print {
  ( $( $arg:expr ),* ) => {
    {
      use crate::io::uart::UartPl011;
      use core::fmt::Write;
      core::write!(UartPl011{}, $($arg),*).expect("Print failed");
    }
  }
}

#[macro_export]
macro_rules! println {
  ( $( $arg:expr ),* ) => {
    {
      use crate::io::uart::UartPl011;
      use core::fmt::Write;
      core::writeln!(UartPl011{}, $($arg),*).expect("Print failed");
    }
  }
}

pub use print;
pub use println;
```

Sekarang, kita bisa melakukan print seperti berikut:

```rust

fn test_uart() {
  uart::pl011_init();
  uart::pl011_puts("UART TEST\r\n");
  uart::pl011_puts("Hello, kernel World from Rust!\r\n");

  uart::println!(
    "Decimal number print test (expected: 1234567890): {}",
    1234567890
  );
  uart::println!(
    "Hexadecimal number print test (expected: 0xCAFECAFE): 0x{:X}",
    0xCAFECAFE as i64
  );

  loop {
    uart::pl011_putc(uart::pl011_getc());
  }
}
```

```shell
qemu-system-aarch64 \
  -nographic \
  -M raspi3b \
  -kernel target/aarch64-unknown-none/debug/osdev

UART TEST
Hello, kernel World from Rust!
Decimal number print test (expected: 1234567890): 1234567890
Hexadecimal number print test (expected: 0xCAFECAFE): 0xCAFECAFE
```

## Informasi yang terlewatkan

Sebelumnya sudah disinggung sebelumnya bahwa _baud rate_ dari PL011 UART berasal
dari base clock khusus, yang mana untuk membaca frekuensi clock tersebut harus
melalui protokol Mailbox yang belum diimplementasikan. Untuk Raspberry Pi 3,
frekuensi dari clock tersebut biasanya di-set ke 3MHz, atau untuk versi
bootloader yang terbaru, di-set ke 48MHz. Apabila ada masalah dalam output,
mungkin bisa disesuaikan register `IBRD` dan `FBRD` nya dengan clock rate
tersebut.

## Kesimpulan

UART adalah salah satu peripheral device yang digunakan untuk melakukan
komunikasi serial. Komunikasi menggunakan UART lebih simpel daripada melakukan
input-output lain untuk membantu kita debugging. Raspberry Pi memiliki dua buah
UART device dan kita berhasil mengoperasikan salah satunya.

Referensi kode bisa juga dilihat di [commit
ini](https://github.com/firmanhp/firmanhp.github.io/commit/28d3d6d8d2732710fc1cb5e623bed7afbb4f90bb).

Untuk selanjutnya, mungkin bisa dikembangkan lebih lanjut untuk mengembangkan
peripheral yang lain, seperti Mailbox, ataupun Display. Kita bisa juga untuk
mulai mengimplmenetasikan _memory management_.

## Referensi

- [OSDev Wiki Raspberry Pi Bare
  Bones](https://wiki.osdev.org/Raspberry_Pi_Bare_Bones)
- [BCM2837 datasheet + errata
  PDF](https://github.com/raspberrypi/documentation/issues/325#issuecomment-379651504)
- [Raspberry Pi 3 Model
  B](https://www.raspberrypi.com/products/raspberry-pi-3-model-b/)
- [Rust Macro core::write](https://doc.rust-lang.org/core/macro.write.html)
- [RPi BCM2835 GPIOs](https://elinux.org/RPi_BCM2835_GPIOs)
- [Understanding Universal Asynchronous
  Receiver/Transmitter](https://www.analog.com/en/resources/analog-dialogue/articles/uart-a-hardware-communication-protocol.html)
