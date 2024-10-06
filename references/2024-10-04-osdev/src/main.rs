#![no_std]
#![no_main]

mod synchronization;
mod io;
mod boot;

use io::gpio;

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

#[panic_handler]
fn on_panic(_info: &core::panic::PanicInfo) -> ! {
  loop {}
}
