use crate::io::gpio;
use crate::io::mmio;

struct Reg;
#[allow(dead_code)]
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
#[allow(dead_code)]
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

pub struct UartPl011;
impl core::fmt::Write for UartPl011 {
  fn write_str(&mut self, s: &str) -> core::fmt::Result {
    pl011_puts(s);
    Ok(())
  }
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

pub fn pl011_putc(c: u8) {
  // Wait for TX FIFO not empty
  while mmio::read(Reg::PL011_FR) & Bit::PL011_FR_TXFF != 0 {}
  mmio::write(Reg::PL011_DR, c as u32);
}

pub fn pl011_puts(s: &str) {
  for c in s.as_bytes() {
    pl011_putc(*c);
  }
}

pub fn pl011_getc() -> u8 {
  // Wait for any inputs
  while mmio::read(Reg::PL011_FR) & Bit::PL011_FR_RXFE != 0 {}
  return (mmio::read(Reg::PL011_DR) & 0xFF) as u8;
}

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
