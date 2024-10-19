CC = g++
OUT = out

CCFLAGS = -std=c++17 -I./my_library_v1 -Wextra
LIBPATH = ./my_library_v1
LIBPATH_V2 = ./my_library_v2
LIBNAME = mylib
LDFLAGS = -L./$(LIBPATH) -l$(LIBNAME)

main: main.cpp
	$(CC) $(CCFLAGS) $(LDFLAGS) -o main main.cpp && chmod +x main

sizecomp: sizecomp.cpp
	$(CC) $(CCFLAGS) $(LDFLAGS) -o sizecomp sizecomp.cpp && chmod +x sizecomp

all: main sizecomp

main_run_v1: main
	LD_LIBRARY_PATH=$(LIBPATH) DYLD_LIBRARY_PATH=$(LIBPATH) ./main

main_run_v2: main
	LD_LIBRARY_PATH=$(LIBPATH_V2) DYLD_LIBRARY_PATH=$(LIBPATH_V2) ./main

sizecomp_run_v1: sizecomp
	LD_LIBRARY_PATH=$(LIBPATH) DYLD_LIBRARY_PATH=$(LIBPATH) ./sizecomp

sizecomp_run_v2: sizecomp
	LD_LIBRARY_PATH=$(LIBPATH_V2) DYLD_LIBRARY_PATH=$(LIBPATH_V2) ./sizecomp

clean:
	rm main
	rm sizecomp
