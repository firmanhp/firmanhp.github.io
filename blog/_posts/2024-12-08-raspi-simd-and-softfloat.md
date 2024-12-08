---
title: "Project Log: SIMD, and -softfloat"
date: 2024-12-08 21:30:00 +0800
categories: [OS]
tags: [systems-programming, rust, qemu]
description: "Figuring out how a CPU \"breaks\" when executing a certain instruction"
# media_subpath: /assets/2024-10-27-raspi-mailboxes
render_with_liquid: true
---

I've been trying to implement interrupts for my OSDev project. Every tutorials
out there tells me that I need to construct my Interrupt Vector Table, then
assign the address into `VBAR_EL1` register, then [you're
done](https://github.com/firmanhp/osdev/commit/96f9d5a645c250f3773ccfe84b8bca04d45443e2).
Unfortunately, that was not as easy at it looks.

I read the `VBAR_EL1` definition and it mentioned something around "to be taken
on EL1". This EL1 seems to be an exception level. I learned about privilege ring
levels back in my college, and it seems to be the same thing as that, but for
ARM. So I checked my exception level on QEMU, and it shows that I am already on
EL3 (the top level), and the operating system is supposed to be running on EL1.

From here, the next step would be: _how do we switch from EL3 into EL1?_.
Fortunately, it was also covered in the Raspberry Pi OS tutorial by Sergey
Matyukevich
[here](https://github.com/s-matyukevich/raspberry-pi-os/blob/master/src/lesson03/src/boot.S).
It is also present in the actual [linux kernel
codebase](https://github.com/torvalds/linux/blob/master/arch/arm64/kernel/head.S#L257).
The main idea is to:
1. Configure the CPU control flags for EL1 through `SCTLR_EL1`, `SPSR_EL1`
2. Set up the return address (where we will start executing) in `ELR_EL3`
3. Call `ERET` (Exception Return) to "exit" from the exception, using the return
   address and restores the control flags.

I tried [putting the
code](https://github.com/firmanhp/osdev/commit/87f1ea3da217b1fa60ecec946d6c3ea5427fbf72),
executing on QEMU, and...

No output.

What's wrong???

## Debugging session

So I fired up gdb, and ran the instructions one by one. I found out that not all
system registers can be printed by GDB for some reason, so I had to put some
dummy operations. I put some `nop` instructions for my breakpoint, and dump the
register I used to assign the system register value. For example, I want to
check `CurrentEL`

```
mrs x0, CurrentEL
nop // for my breakpoint
```

Then I dump the `x0` register. Very obvious, but useful for me.

For my newly added sequence, it seems to have no issues, the instruction
proceeds one by one... Until the program counter pointed at some wacky value
outside of my program. This always happen after it executed a certain
instruction in my program.

```shell
(gdb) ni
0xd503201f140003e0 in ?? ()
```

The value `0xd503201f140003e0` is actually my program counter, and it was
obviously pointing somewhere that is outside of my memory (I am still using
physical memory addressing). So I decided to take a look at the assembly.

```shell
0000000000082e84 <_ZN4core3ptr13read_volatile18precondition_check17h3ecfd8b8af5fa566E>:
   ...
   82eb0: 14000001     	b	0x82eb4 <_ZN4core3ptr13read_volatile18precondition_check17h3ecfd8b8af5fa566E+0x30>
   82eb4: 1400000c     	b	0x82ee4 <_ZN4core3ptr13read_volatile18precondition_check17h3ecfd8b8af5fa566E+0x60>
   82eb8: f94007e8     	ldr	x8, [sp, #0x8]
   82ebc: 9e670100     	fmov	d0, x8
   82ec0: 0e205800     	cnt	v0.8b, v0.8b
   82ec4: 2e303800     	uaddlv	h0, v0.8b
   ...
```

Well, I think I found the reason. It is executing `cnt	v0.8b, v0.8b` which
involved SIMD registers. Previously this line of code worked when I did not
switch from EL3 to EL1, so perhaps I missed some configuration to allow my CPU
to execute SIMD operations on EL1.

## Fixing

There are two approaches to fix this.
- Make the CPU support running SIMD operations on EL1, or
- Force the compiler to not use SIMD operations on my bare metal programs.

Which one to choose? The first option seems to be an obviously easy choice.
**Actually, it is not**. If we were to involve other sets of registers to operate in
our program, then we have to also be responsible to back these up when a context
switch occurs. For example, when an interrupt happens, we are going to modify
several registers to do some computations in our interrupt service routine, then
we have to restore those registers back when we are returning from our
interrupt. Those SIMD registers need to be backed up because we probably will
use those during our interrupt service routine. Therefore, adding a new set of
registers that we can work on, means that we also have to add those there.

> This is the
[code](https://github.com/firmanhp/osdev/commit/96f9d5a645c250f3773ccfe84b8bca04d45443e2#diff-af53155039e3a9943779ab9c62b54b42c509b9a69659616879de177f3932ce0fR62)
where we back up, and restore our registers. 
{: .prompt-info}

Based on the above, then changing the compiler config seems to be much easier in
terms of maintenance. Fortunately for us, we don't have to recompile the core
library (which needs a nightly Rust to do that). The rustc already supports
[`aarch64-unknown-none-softfloat`](https://doc.rust-lang.org/rustc/platform-support.html)
which means it will do a software emulation on floating point operations, and
disables SIMD. You can see the build target dump here:

```json
{
  "abi": "softfloat",
  "arch": "aarch64",
  "crt-objects-fallback": "false",
  "data-layout": "e-m:e-i8:8:32-i16:16:32-i64:64-i128:128-n32:64-S128-Fn32",
  "disable-redzone": true,
  "features": "+v8a,+strict-align,-neon,-fp-armv8",
  "is-builtin": true,
  "linker": "rust-lld",
  "linker-flavor": "gnu-lld",
  "llvm-target": "aarch64-unknown-none",
  "max-atomic-width": 128,
  "metadata": {
    "description": "Bare ARM64, softfloat",
    "host_tools": false,
    "std": false,
    "tier": 2
  },
  "panic-strategy": "abort",
  "relocation-model": "static",
  "stack-probes": {
    "kind": "inline"
  },
  "target-pointer-width": "64"
}
```

As you can see, it disables the NEON (ARM's SIMD) and `fp-armv8` feature, which
is what we want. Checking back our assembly dump for the same symbol.

```shell
00000000000864fc <_ZN4core3ptr13read_volatile18precondition_check17ha8e5bab4712a4397E>:
   ...
   <_ZN4core3ptr13read_volatile18precondition_check17ha8e5bab4712a4397E+0x34>
   86528: 14000001     	b	0x8652c <_ZN4core3ptr13read_volatile18precondition_check17ha8e5bab4712a4397E+0x30>
   8652c: 14000013     	b	0x86578 <_ZN4core3ptr13read_volatile18precondition_check17ha8e5bab4712a4397E+0x7c>
   86530: f94007e8     	ldr	x8, [sp, #0x8]
   86534: d341fd09     	lsr	x9, x8, #1
   86538: 9200f129     	and	x9, x9, #0x5555555555555555
   8653c: eb090109     	subs	x9, x8, x9
   86540: 9200e528     	and	x8, x9, #0x3333333333333333
   86544: d342fd29     	lsr	x9, x9, #2
   86548: 9200e529     	and	x9, x9, #0x3333333333333333
   8654c: 8b090108     	add	x8, x8, x9
   86550: 8b481108     	add	x8, x8, x8, lsr #4
   86554: 9200cd08     	and	x8, x8, #0xf0f0f0f0f0f0f0f
   86558: b200c3e9     	mov	x9, #0x101010101010101  // =72340172838076673
   8655c: 9b097d08     	mul	x8, x8, x9
   86560: d378fd08     	lsr	x8, x8, #56
   86564: b9006fe8     	str	w8, [sp, #0x6c]
   86568: b9406fe8     	ldr	w8, [sp, #0x6c]
   8656c: 71000508     	subs	w8, w8, #0x1
   ...
```

Now our code has no SIMD operations there, and now my code runs in EL1!

```shell
./qemu-test.sh
Executing in level Kernel
Timer setup!
Hey, an interrupt!
Timer woo woo! do it again!
Timer wait...
Hey, an interrupt!
Second timer, yay!
Timer wait...
Timer wait...
QEMU: Terminated
```

## Does it run on the actual machine?

Unfortunately, no.. However, I found that my program tells me that the initial
exception level is on EL2 (which I didn't handle at this time of writing). The next
step would be properly configuring from EL2 into EL1.

> All changes I've made can bee seen on this [GitHub commit window](https://github.com/firmanhp/osdev/commits/main/?since=2024-11-29&until=2024-12-09).
{: .prompt-info}

See you next time!
