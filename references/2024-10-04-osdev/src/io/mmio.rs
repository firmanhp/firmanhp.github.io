
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
