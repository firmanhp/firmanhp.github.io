---
title: "Project log: on linker script debugging"
date: 2024-10-10 12:00:00 +0800
categories: [OS]
tags: [systems-programming, rust, binary-analysis]
description: "I messed up because of a blind copy paste (again). Rust's panic saved me this time."
media_subpath: /assets/2024-10-10-linker-debugging
render_with_liquid: true
---

## Background

I finally made UART working on my bare metal Raspberry Pi project. Despite the
datasheet saying that the baud rate is derived from a certain base clock, which
I don't know what was the actual clock rate, it actually worked out of the box
using 112500bps. I guess that was a lucky shot. For my sanity I proceeded to
make a working output mechanism first before I mess with other peripherals.

### Printing an integer

How do you print an integer? Convert it to string first? But I don't have a
string data structure and memory management yet. I had to manually print it,
digit by digit. How am I going to do that?

Well, there's this quite common fact that in base 10 decimal system, doing
`N mod 10` gives you the last digit of the number, and `N div 10` shifts the
number to the right. Repeat that until you achieve 0, then you can print the
digits one by one.

```rust
pub fn pl011_putint(mut int: i64) {
  if int == 0 {
    pl011_putc('0' as u8);
    return;
  }
  
  let is_negative: bool = int < 0;
  if is_negative {
    int = -int;
  }

  // Fetch digits
  while int > 0 {
    let digit: u8 = (int % 10) as u8;
    pl011_putc(('0' as u8) + digit);
    int /= 10;
  }
}
```

This gives you the printed number, but in reverse. How do we reverse it back? If
you are good in math, you may figure out how to print from the most significant
digit. However, I am not good in math, so as a software engineer, I decided to
overengineer it using a stack data structure (_why not?_ 😂). If I put the
digits into the stack, then popping it back gives you the digit in reverse
order, which means you get them in the correct order.

### The Stack

I don't have dynamic memory allocation yet so I made it based on a fixed size
array.

```rust
pub struct Stack<T, const N: usize>
where T: Copy {
  data: [MaybeUninit<T>; N],
  head: usize,
}

#[allow(dead_code)]
impl<T, const N: usize> Stack<T, N> 
where T: Copy {
  pub fn size(&self) -> usize { self.head }
  pub fn empty(&self) -> bool { self.size() == 0 }

  pub fn push(&mut self, data: T) { 
    if self.size() >= N { panic!("Stack overflow"); }
    self.data[self.head] = MaybeUninit::<T>::new(data);
    self.head += 1;
  }

  pub fn pop(&mut self) -> T {
    if self.empty() { panic!("Stack is empty"); }
    self.head -= 1;
    // TODO: drop?
    unsafe { self.data[self.head].assume_init() }
  }

  pub const fn new() -> Self {
    Self {
      data: [MaybeUninit::<T>::uninit(); N],
      head: 0
    }
  }
}
```

With this I should achieve a proper integer printing:

```rust
static mut CHARBUF: container::Stack<u8, 256> =
    container::Stack::<u8, 256>::new();

fn pl011_flush() {
  // Print digits
  unsafe {
    while !CHARBUF.empty() {
      pl011_putc(CHARBUF.pop());
    }
  }
}

pub fn pl011_putint(mut int: i64) {
  if int == 0 {
    pl011_putc('0' as u8);
    return;
  }

  if int < 0 {
    unsafe { CHARBUF.push('-' as u8); }
    int = -int;
  }

  // Fetch digits
  while int > 0 {
    let digit: u8 = (int % 10) as u8;
    unsafe { CHARBUF.push(('0' as u8) + digit); }
    int /= 10;
  }

  pl011_flush();
}
```

The design is questionable, I just plan to make it simple first. Since it only
runs on a single core, I didn't care too much.

## The problem

I made a small test around those that I can run on my target machine.

```rust
pub fn test_uart() {
  uart::pl011_puts("UART Test\r\n");
  uart::pl011_puts("Hello, kernel World from Rust!\r\n");

  uart::pl011_puts("Decimal number print test (expected: 1234567890)\r\n");
  uart::pl011_putint(1234567890); uart::pl011_puts("\r\n");
  
  loop { 
    uart::pl011_putc(uart::pl011_getc());
  }
}
```

Running it, I got:

```
UART Test
Hello, kernel World from Rust!
Decimal number print test (expected: 1234567890)
```

Umm... Where's my number? Did my program stuck in an infinite loop somewhere?
Did it go panic?

### Working on my Panic handler

At this point I started to revamp my panic handling code to print some helpful
messages. Apparently the PanicInfo has a statically sized string containing the
message. I also tried to print the code pointer, and the line number (in reverse
order).

Luckily (and unluckily) I get this message:

```
UART Test
Hello, kernel World from Rust!
Decimal number print test (expected: 1234567890)
PANIC: No message
src/container/stack.rs
03
```

So it was a panic. The line number pointed to this line:
`self.data[self.head] = MaybeUninit::<T>::new(data);`.
Where did it go wrong? Why is there no message in the panic? Is there a bounds
check in my bare metal program? Or is my usage of `MaybeUninit::<T>::new` wrong?
Being very new to Rust, I decided to inspect the binary output of the compiled
ELF using ghidra (_or it's just me seeing this as an opportunity to learn
ghidra_).

```c
void __rustcall osdev::container::stack::Stack<u8,_256>::push<u8,_256>(Stack<u8,_256> *self,u8 data)

{
  usize uVar1;
  Arguments AStack_50;
  Stack<u8,_256> *local_20;
  u8 local_13;
  u8 local_12;
  u8 local_11;
  
  local_20 = self;
  local_13 = data;
  uVar1 = size<u8,_256>(self);
  if (uVar1 == 0x100) {
    core::fmt::Arguments::new_const<1>(&AStack_50,(&str (*) [1])&PTR_s_Stack_overflow_00086918);
                    /* WARNING: Subroutine does not return */
    core::panicking::panic_fmt();
  }
  local_12 = data;
  local_11 = data;
  if (0xff < self->head) {
                    /* WARNING: Subroutine does not return */
    core::panicking::panic_bounds_check();
  }
  self->data[self->head] = (MaybeUninit<u8>)data;
  if (self->head != 0xffffffffffffffff) {
    self->head = self->head + 1;
    return;
  }
                    /* WARNING: Subroutine does not return */
  core::panicking::panic_const::panic_const_add_overflow();
}
```

Indeed there is a bounds checking there on line 21 (_or I should have googled
that up_). I added more checks on my `Stack` class by printing the `head` value.

```
UART Test
Hello, kernel World from Rust!
Decimal number print test (expected: 1234567890)
[STACKDBG] head pos: 50206640130215523641
PANIC: No message
src/container/stack.rs
03
```

Huh, why is my head value is a random junk value? I had explicitly put an
initialized value on my `pub const fn new()`! What is going on?

### Root causing

Usually junk values are a sign of uninitialized data. I remembered that these
static data live inside the `.bss` segment, which I thought I already filled it
with zero at my assembly's entry point. Additionally, explicitly initializing
through `new()` also gave me confusion.

```
    // clear bss
    ldr     x5, =__bss_start
    ldr     w6, =__bss_size
1:  cbz     w6, 2f
    str     xzr, [x5], #8
    sub     w6, w6, #1
    cbnz    w6, 1b
```

These `__bss_start` and `__bss_size` symbol was generated through this part of
linker script:

```
__bss_start = .;
.bss :
{
    bss = .;
    *(.bss)
}
. = ALIGN(4096); /* align to page size */
__bss_end = .;
__bss_size = __bss_end - __bss_start;
```

> Take a guess: I just copy pasted that code. What's wrong with the code?
{: .prompt-info}

Taking a look of the `objdump` of the binary:

```
target/aarch64-unknown-none/debug/osdev:	file format elf64-littleaarch64

SYMBOL TABLE:
...
0000000000080000 g       .text	0000000000000000 _start
0000000000088000 g       .rodata	0000000000000000 __bss_start
0000000000000000 g       *ABS*	0000000000000000 __bss_size
0000000000088000 g       .bss	0000000000000000 __bss_end
```

Oh, look. my `__bss_size` points to a value 0, and my `__bss_start` -
`__bss_end` points to the same value. So this means my `.bss` zeroing logic
didn't work. That explains the `head` value picking up garbage values. The RAM
was uninitialized.

Taking another look on the dump, it turns out the `.bss` section on my linker
script did not pick up any `.bss` sections from any object files at all 😓

```
> objdump -dt target/aarch64-unknown-none/debug/osdev | grep ".bss"

0000000000088000 l     O .bss._ZN5osdev2io4uart7CHARBUF17hc80dca2c0e52eba2E	0000000000000548 _ZN5osdev2io4uart7CHARBUF17hc80dca2c0e52eba2E
0000000000088000 l       .bss._ZN5osdev2io4uart7CHARBUF17hc80dca2c0e52eba2E	0000000000000000 $d.9
0000000000088548 l       .bss._ZN5osdev2io4mmio9BASE_ADDR17h4c868743b35a3ef8E	0000000000000000 $d.1
0000000000088548 l     O .bss._ZN5osdev2io4mmio9BASE_ADDR17h4c868743b35a3ef8E	0000000000000008 .hidden _ZN5osdev2io4mmio9BASE_ADDR17h4c868743b35a3ef8E
0000000000088000 g       .rodata	0000000000000000 __bss_start
0000000000000000 g       *ABS*	0000000000000000 __bss_size
0000000000088000 g       .bss	0000000000000000 __bss_end
0000000000088000 g       .bss	0000000000000000 bss
0000000000088000 g       .bss	0000000000000000 __end
```

The fourth column is the section name. These `.bss.xxx` should be coming from
the object file. They are expected to be under the same section `.bss` based on
my script, as seen on the symbol `bss`.

The compiler produces sections with the name `.bss.*MANGLED_NAME*`, and my
linker script only includes a section with the name `*(.bss)`.

## Fixing

Well, the fix is simple, put a wildcard on it.

```
/* *(.bss) --> *(.bss*) */
.bss :
{
    bss = .;
    *(.bss*)
}
```

Rebuild.

### The catch

There's one catch. It could be depending on how you build the project, though.
This linker script is technically not part of the cargo project. Cargo will
watch for any changes happening in the linker script file. If you rebuild the
project. It'll detect as "no changes", and proceeds to do nothing.

There should be a way to prevent this, but in my case, cleaning the build output
before rebuilding works well. The linker script should be very rarely touched.

```
> cargo clean
     Removed 78 files, 4.9MiB total
```

### Result

After rebuilding, the symbols should look OK.

```
objdump -dt target/aarch64-unknown-none/debug/osdev | grep ".bss"
0000000000088000 l     O .bss	0000000000000108 _ZN5osdev2io4uart7CHARBUF17ha44dc8a2b90c415dE
0000000000088000 l       .bss	0000000000000000 $d.9
0000000000088108 l       .bss	0000000000000000 $d.1
0000000000088108 l     O .bss	0000000000000008 .hidden _ZN5osdev2io4mmio9BASE_ADDR17h4c868743b35a3ef8E
0000000000088000 g       .rodata	0000000000000000 __bss_start
0000000000001000 g       *ABS*	0000000000000000 __bss_size
0000000000089000 g       .bss	0000000000000000 __bss_end
0000000000088000 g       .bss	0000000000000000 bss
0000000000089000 g       .bss	0000000000000000 __end
```

Now, symbols are properly inside `.bss` section and `__bss_size` is non-zero.

And my UART test works well now!

```
UART Test
Hello, kernel World from Rust!
Decimal number print test (expected: 1234567890)
1234567890
```

## Lessons learned

Well, if not because of the small scale of the project, I wouldn't have dived
this deep to figure out this undefined behavior error. After figuring this out,
It seems less intimidating using these tools for binary analysis. It provided a
quite clear information on what's happening, as long as you know the columns,
though.

Zero initializing this `.bss` section is important to make sure your global
variable is in a consistent state when you run the program. It seems that for
common OSes, this [section is zero-ed out for
you](https://stackoverflow.com/questions/11424980/why-bss-explicitly-initialize-global-variable-to-zero).

Rust has multiple safety mechanisms unseen in C, runtime bounds checking is one
of them. Although I think there are dividing opinions whether these bound
checks are good for performance. I believe that our CPU's branch prediction
already made the perf impact negligible. I haven't done any comparison, but it's
a welcomed feature.

You also need to be careful when handling project files that are not native to
the cargo system. It should be fixable by some configuration, so perhaps this is
just my Rust skill issue.

### Question left to be answered

I mentioned before that I explicitly put an initialized value on my `pub const
fn new()`. Technically if it's included in the binary, then the memory segment
would be replaced into zeroes, effectively doing the `.bss` zero-ing. My guess
that these "zero-es" got truncated by an optimization pass somewhere in the
linker/`objcopy` stage, but I haven't  got the time to prove it. On the bright
side, I get to uncover this bug.


Well, time to go back to work.
