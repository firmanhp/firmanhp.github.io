---
title: "Emulating Raspberry Pi OS using QEMU"
date: 2024-09-09 00:00:00 +0900
categories: [OS]
tags: [raspberry-pi, qemu]
description: Playing around with QEMU.
media_subpath: /assets/2024-09-09-raspberry-pi-qemu
image:
  path: img/4-model-b.jpg
  alt: Raspberry Pi 4 Model B, Taken from raspberrypi.com
render_with_liquid: false
---

Lately I am interested with [QEMU](https://www.qemu.org). QEMU is an open source software
project which provides a virtualization and emulation with a lot of options (x86_64, ARM,
PowerPC, etc). It also supports many kinds of host machines. Today I just want to try to
emulate a Raspberry Pi machine using QEMU, just to know how QEMU works.

> This post is heavily based on [interrupt.memfault.com post of the same topic](https://interrupt.memfault.com/blog/emulating-raspberry-pi-in-qemu),
with addition of my experiments.
{: .prompt-tip}

> These commands were run on a MacOS running on an M3 chip. Commands and outputs may differ on
different platforms.
{: .prompt-warning}

In this post, we explore on how to emulate a Raspberry Pi 4 Model B machine using QEMU.

## Preparing the files

### OS Version

Assuming that we (obviously) have installed the QEMU package, which on Mac can be installed
through `brew`, we need the Raspberry Pi image from the website, currently they provide 2
versions on the [website](https://www.raspberrypi.com/software/operating-systems/):

- "Raspberry Pi OS" which is based on Debian 12 (`bookworm`) Linux distro.
- "Raspberry Pi OS (Legacy)" which is based on Debian 11 (`bullseye`) distro.

**I had some issues when using the latest distro `bookworm`**, so I'm using the legacy version,
which is based on `bullseye`. I picked up the Lite version, since I only want to run the
CLI applications. Raspberry Pi 4 has a 64-bit processor so we download the 64-bit variant.

### Mounting the boot partition

We need to modify and pull out some files from the boot partition from the downloaded image.
On Mac, `fdisk` shows it can properly read the partitions inside the disk image:
```shell
> fdisk 2024-07-04-raspios-bullseye-arm64-lite.img

Disk: 2024-07-04-raspios-bullseye-arm64-lite.img        geometry: 1019/64/63 [4112384 sectors]
Signature: 0xAA55
         Starting       Ending
 #: id  cyl  hd sec -  cyl  hd sec [     start -       size]
------------------------------------------------------------------------
 1: 0C   64   0   1 - 1023   3  32 [      8192 -     524288] Win95 FAT32L
 2: 83 1023   3  32 - 1023   3  32 [    532480 -    3579904] Linux files*
 3: 00    0   0   0 -    0   0   0 [         0 -          0] unused
 4: 00    0   0   0 -    0   0   0 [         0 -          0] unused
```

What we are interested in is the first partition with `Win95 FAT32L` filesystem. The second
partition is the root filesystem for the Linux OS which we will use later. We need to mount
the partition with read/write access. Luckily on Mac, we can simply mount the image using
`hdiutil`:

```shell
> hdiutil attach 2024-07-04-raspios-bullseye-arm64-lite.img

/dev/disk5              FDisk_partition_scheme
/dev/disk5s1            Windows_FAT_32                  /Volumes/bootfs
/dev/disk5s2            Linux
```

We can see that the boot partition is successfully attached to `/Volumes/bootfs`. This means
we can access the file through the Finder. Once we are done with it later, we can eject using
Finder, or running `hditil detach /Volumes/bootfs`.

### Adding Credentials

From 2022, Raspberry Pi stopped using `pi:raspberry` as their default credentials [(post)](https://www.raspberrypi.com/news/raspberry-pi-bullseye-update-april-2022/).
They said that during the first boot, you will be asked for a set of username and password
to be used. However, in this emulation session, we will not be asked that thing since we will
manually boot the kernel. The Raspberry Pi provided us a way to manually add them, as explained
in the "Headless setup" part. We are going add it this way.

We need to create a file names `userconf.txt` inside of the boot partition. From the post, the
file should contain a single line of text consisting of `username:password_encrypted`. To generate
the encypted password, we need to use `openssl passwd -6`. In our case, we just want the default
credential `pi:raspberry`:

```shell
> cd /Volumes/bootfs
> echo -n "pi:" > userconf.txt
> echo -n "raspberry" | openssl passwd -6 -stdin >> userconf.txt

> cat userconf.txt
pi:$6$6YqlAsOsJSXzqC67$4YLGvwgPcK4qgi6KbF.922pCt6G6TMPc50Bu/HCutdHqgt0/JbwMiFKSry.CWbjIQX/NrfV8ObT1xoqzkf3Br1
```

### Pulling Device Tree and Kernel Image

In order to boot the Linux kernel on Raspberry Pi, it needs the **device tree** which is inside the files
called *device tree blob* (`dtb`). The device tree is a format to describe the locations of hardware
inside the computer. This is quite common in embedded systems. While in PC realm, most of the hardware
are [discoverable](https://unix.stackexchange.com/questions/399619/why-do-embedded-systems-need-device-tree-while-pcs-dont),
and use a different (older) standard of "device tree" called [ACPI tables](https://en.wikipedia.org/wiki/ACPI).
The Linux kernel will use this device tree structure to figure out which drivers to load, and configure them.

Inside the `bootfs`, we can see multiple `dtb` files:

```shell
> ls -la | grep -iE "dtb"

-rwx------  1 firmanhp  staff    30390 Apr  5  2023 bcm2710-rpi-2-b.dtb
-rwx------  1 firmanhp  staff    32753 Apr  5  2023 bcm2710-rpi-3-b-plus.dtb
-rwx------  1 firmanhp  staff    32142 Apr  5  2023 bcm2710-rpi-3-b.dtb
-rwx------  1 firmanhp  staff    30285 Apr  5  2023 bcm2710-rpi-cm3.dtb
-rwx------  1 firmanhp  staff    31318 Apr  5  2023 bcm2710-rpi-zero-2-w.dtb
-rwx------  1 firmanhp  staff    31318 Apr  5  2023 bcm2710-rpi-zero-2.dtb
-rwx------  1 firmanhp  staff    52593 Apr  5  2023 bcm2711-rpi-4-b.dtb
-rwx------  1 firmanhp  staff    52682 Apr  5  2023 bcm2711-rpi-400.dtb
-rwx------  1 firmanhp  staff    38182 Apr  5  2023 bcm2711-rpi-cm4-io.dtb
-rwx------  1 firmanhp  staff    53202 Apr  5  2023 bcm2711-rpi-cm4.dtb
-rwx------  1 firmanhp  staff    50504 Apr  5  2023 bcm2711-rpi-cm4s.dtb
```

Each `dtb` file corresponds to one machine. For example, `bcm2710-rpi-3-b.dtb` contains the device tree
for Raspberry Pi 3 Model B+. During the machine's boot process, it will look up which `dtb` they will use
based on the identity of the machine (which may vary by machines and vendor). The bootloader will load
the `dtb` and boot up the kernel.

In our case, we will try to emulate Raspberry Pi 4 Model B, so we will pull out `bcm2711-rpi-4-b.dtb` to
our own directory.
```shell
> cp bcm2711-rpi-4-b.dtb ~/Code/raspi-emu/my-image
```

We also need to pull the `kernel8.img`, where the kernel resides:
```shell
> cp kernel8.img ~/Code/raspi-emu/my-image
```

### The "SD card" image

The image that we just downloaded and modified, shall become the base of the SD card contents of the
machine, let's move it into the same folder as other files that we just pulled:
```shell
> mv $(YOUR_IMAGE).img ~/Code/raspi-emu/my-image
```

However, QEMU requires that the emulated SD card size to be a power of 2. We shall resize the image
using the built-in tool in QEMU `qemu-img` to resize. Note that the resized result needs to be bigger than
the current size, and power of 2 of course:

```shell
> qemu-img resize ./2024-07-04-raspios-bullseye-arm64-lite.img 4G

WARNING: Image format was not specified for './2024-07-04-raspios-bullseye-arm64-lite.img' and probing guessed raw.
         Automatically detecting the format is dangerous for raw images, write operations on block 0 will be restricted.
         Specify the 'raw' format explicitly to remove the restrictions.
Image resized.
```

## Running QEMU

We have all the files ready. Let's run QEMU with `aarch64` system:

```shell
qemu-system-aarch64 \
  -machine raspi4b \
  -nographic \
  -dtb bcm2711-rpi-4-b.dtb \
  -kernel kernel8.img \
  -sd 2024-07-04-raspios-bullseye-arm64-lite.img \
  -append "loglevel=8 root=/dev/mmcblk1p2 rootdelay=1 console=ttyAMA0,115200"
```

Below are explanations on the args. For more details,
refer to the [official docs](https://www.qemu.org/docs/master/system/invocation.html)
and [Linux docs](https://www.kernel.org/doc/html/v4.14/admin-guide/kernel-parameters.html):
- `-machine`: Used by QEMU to prepare the machine presets (RAM size, CPU core count, etc)
- `-nographic`: Do not use GUI and let any outputs go to the terminal. This is useful for troubleshooting
  because we couldn't scroll in the graphics mode.
- `-dtb`: Which device tree blob to load.
- `-kernel`: Which kernel image to load.
- `-sd`: The image that will be used as the SD card. By default QEMU allows read/write access into the image.
- `-append`: Additional kernel arguments to be added.
  - `loglevel=8`: Increase log verbosity. 8 means all kinds of logs.
  - `root=/dev/mmcblk1p2`: Which device to mount as the root filesystem. How to figure this out can be
    seen on [troubleshooting below](#troubleshooting).
  - `rootdelay=1`: How long to wait (in seconds) before mounting the root filesystem. Apparently this is
    important because we do not want to mount before the SD card driver detects our SD card (and causing
    kernel panic due to inexistent device).
  - `console=ttyAMA0,115200`: Which console to output the kernel logs. From the
    [original post](https://interrupt.memfault.com/blog/emulating-raspberry-pi-in-qemu),
    this is required so QEMU can receive the kernel logs.

If boots correctly, we will see floods of kernel logs, and be greeted by the standard Linux
prompt asking for our username and password.

```shell
[  OK  ] Started Getty on tty1.
[  OK  ] Started Serial Getty on ttyAMA0.
[  OK  ] Reached target Login Prompts.
[  OK  ] Started User Login Management.
[  OK  ] Started Modem Manager.

Debian GNU/Linux 11 raspberrypi ttyAMA0

raspberrypi login:
```

We filled out `pi:raspberry` as the credential, therefore we can fill out `pi` and `raspberry` as the
username and password, respectively.

```shell
raspberrypi login: pi
Password:
Linux raspberrypi 6.1.21-v8+ #1642 SMP PREEMPT Mon Apr  3 17:24:16 BST 2023 aarch64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Thu Jul  4 01:16:52 BST 2024 on ttyAMA0
pi@raspberrypi:~$
```

We now have a running Linux virtual machine! You can exit the machine by pressing `CTRL+a` then press `x`.
Let's run few commands:

```shell
pi@raspberrypi:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/root       1.7G  1.4G  204M  88% /
devtmpfs        427M     0  427M   0% /dev
tmpfs           461M     0  461M   0% /dev/shm
tmpfs           185M  748K  184M   1% /run
tmpfs           5.0M     0  5.0M   0% /run/lock
/dev/mmcblk1p1  255M   31M  225M  13% /boot
tmpfs            93M     0   93M   0% /run/user/1000

pi@raspberrypi:~$ sudo fdisk -l
...
Disk /dev/mmcblk1: 4 GiB, 4294967296 bytes, 8388608 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x42e57318

Device         Boot  Start     End Sectors  Size Id Type
/dev/mmcblk1p1        8192  532479  524288  256M  c W95 FAT32 (LBA)
/dev/mmcblk1p2      532480 4112383 3579904  1.7G 83 Linux
```

It can be seen that the `/` partition is only 1.7G, despite the SD card size showing
4GiB as expected from the resizing that we did. We could resize the partition to fit
all the remaining free space but I'm not sure if we can do it on runtime. I didn't explore
more about this.

Another interesting thing is we could write something onto the disk and it will persist:

```shell
pi@raspberrypi:~$ echo "Hello world!" > hello.txt
pi@raspberrypi:~$ ls -la
total 28
drwxr-xr-x 2 pi   pi   4096 Jul  4 01:28 .
drwxr-xr-x 3 root root 4096 Jul  4 01:05 ..
-rw------- 1 pi   pi    112 Jul  4 01:16 .bash_history
-rw-r--r-- 1 pi   pi    220 Jul  4 01:05 .bash_logout
-rw-r--r-- 1 pi   pi   3523 Jul  4 01:05 .bashrc
-rw-r--r-- 1 pi   pi     13 Jul  4 01:28 hello.txt
-rw-r--r-- 1 pi   pi    807 Jul  4 01:05 .profile

pi@raspberrypi:~$ sudo halt
...
[  OK  ] Reached target Shutdown.
[  OK  ] Reached target Final Step.
         Starting Halt...
[  534.250732] reboot: System halted

# After running the QEMU command again
Debian GNU/Linux 11 raspberrypi ttyAMA0

raspberrypi login: pi
Password:
Linux raspberrypi 6.1.21-v8+ #1642 SMP PREEMPT Mon Apr  3 17:24:16 BST 2023 aarch64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Thu Jul  4 01:21:59 BST 2024 on ttyAMA0
pi@raspberrypi:~$ ls -la
total 28
drwxr-xr-x 2 pi   pi   4096 Jul  4 01:28 .
drwxr-xr-x 3 root root 4096 Jul  4 01:05 ..
-rw------- 1 pi   pi    239 Jul  4 01:29 .bash_history
-rw-r--r-- 1 pi   pi    220 Jul  4 01:05 .bash_logout
-rw-r--r-- 1 pi   pi   3523 Jul  4 01:05 .bashrc
-rw-r--r-- 1 pi   pi     13 Jul  4 01:28 hello.txt
-rw-r--r-- 1 pi   pi    807 Jul  4 01:05 .profile
pi@raspberrypi:~$ cat hello.txt
Hello world!
```

The original post also mentioned that we could also make the machine to be accessible via SSH,
but I didn't bother for now.

### Troubleshooting

Here are some findings when doing this small experiment.

#### QEMU Monitor mode

QEMU has a special "monitor" mode that we can invoke by pressing `Ctrl+a` then press `c`. From there, we can do
many stuffs. For example, taking a screenshot of the graphics, even in `-nographics` mode. For more details,
we can run `help` command. To return back to the console, press `Ctrl+a -> c` again.

![Example of screendump](/img/screendump.png)
_Example of QEMU `screendump`._

#### No kernel logs

I met an issue where I couldn't see the kernel logs in the terminal despite having `-nographics` set. However,
I could see it when I run it with graphics. I still don't know what's wrong, but I fixed it by downgrading
the OS version from 12 `bookworm` to 11 `bullseye`.

#### Kernel panic

This is the thing that I found when copying 1:1 from the original post. I used a different version of the OS, though.
The original post uses `root=/dev/mmcblk0p2` instead of `root=/dev/mmcblk1p2`. I met this kind of kernel panic:

```shell
[    3.298226] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)
[    3.298560] CPU: 3 PID: 1 Comm: swapper/0 Not tainted 6.1.21-v8+ #1642
[    3.298810] Hardware name: Raspberry Pi 4 Model B (DT)
[    3.299122] Call trace:
[    3.299282]  dump_backtrace+0x120/0x130
[    3.299494]  show_stack+0x20/0x30
[    3.299620]  dump_stack_lvl+0x8c/0xb8
[    3.299740]  dump_stack+0x18/0x34
[    3.299834]  panic+0x1a4/0x37c
[    3.299926]  mount_block_root+0x140/0x21c
[    3.300046]  mount_root+0x1e8/0x21c
[    3.300126]  prepare_namespace+0x134/0x174
[    3.300220]  kernel_init_freeable+0x2a0/0x2cc
[    3.300324]  kernel_init+0x2c/0x138
[    3.300412]  ret_from_fork+0x10/0x20
[    3.300820] SMP: stopping secondary CPUs
[    3.301252] Kernel Offset: disabled
[    3.301402] CPU features: 0x20000,2003c080,0000421b
[    3.301628] Memory Limit: none
[    3.301974] ---[ end Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0) ]---
```

In addition to no kernel log on terminal that I met, this made debugging really hard. From the message, it looked like
an error occured during mounting the root filesystem. After downgrading, I finally could scroll the messages and I found
this message:

```shell
[    3.292562] /dev/root: Cant open blockdev
[    3.293044] VFS: Cannot open root device "mmcblk0p2" or unknown-block(0,0): error -6
[    3.293224] Please append a correct "root=" boot option; here are the available partitions:
...
[    3.297172] b300         4194304 mmcblk1
[    3.297214]  driver: mmcblk
[    3.297432]   b301          262144 mmcblk1p1 42e57318-01
[    3.297528]
[    3.297724]   b302         1789952 mmcblk1p2 42e57318-02
```

So I could correct the argument to be `/dev/mmcblk1p2`. The kernel panic disappears after that.

#### rootdelay=1

I was curious on why do we even need to delay. It turns out, that if we remove this, we will meet the same
kernel panic as above. The debugging message is a bit different, though:
```shell
[    2.279046] mmc1: host does not support reading read-only switch, assuming write-enable
[    2.280205] mmc1: new high speed SDHC card at address 4567
[    2.284859] mmcblk1: mmc1:4567 QEMU! 4.00 GiB
[    2.285110] /dev/root: Cant open blockdev
[    2.285425] VFS: Cannot open root device "mmcblk1p2" or unknown-block(0,0): error -6
[    2.285907] Please append a correct "root=" boot option; here are the available partitions:
...
[    2.289019] 0000         4194304 mmcblk1
[    2.289049]  driver: mmcblk
[    2.289412] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)
```

It didn't see the `mmcblk1p2` as expected. To me it looks like the kernel tries to mount the root filesystem
before the SD card driver even finishes probing the partitions inside the device. IMO there should be a proper
way to wait instead of delaying, but I don't know.

## Conclusion

We managed to run QEMU to emulate a Raspberry Pi machine. It took me a while to sort the failures since this is
my first time using QEMU. Overall I am quite happy that I could understand some of the inner workings of
the emulation.

The original post also mentions on how to access the machine via SSH, and how to dockerize it as well, so be sure
to [check it out](https://interrupt.memfault.com/blog/emulating-raspberry-pi-in-qemu).
