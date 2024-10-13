#![no_std]
#![no_main]

mod synchronization;
mod io;
mod boot;

use io::gpio;
use io::uart;

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


#[no_mangle]
extern "C" fn kernel_main() {
  test_uart();

  // This part of the code is unreachable atm
  gpio::set_function(1 << 4, gpio::Function::Output);
  loop {
    gpio::output_set(1 << 4);
    synchronization::sleep(500_000);
    gpio::output_clear(1 << 4);
    synchronization::sleep(500_000);
  }
}

#[panic_handler]
fn on_panic(_info: &core::panic::PanicInfo) -> ! {
  loop {}
}
