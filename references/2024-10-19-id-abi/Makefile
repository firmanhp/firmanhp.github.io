
CC = g++
OUT = out

CCFLAGS = -std=c++17 -I./my_library_v1 -Wextra
LIBPATH = ./my_library_v1
LIBPATH_V2 = ./my_library_v2
LIBNAME = mylib
LDFLAGS = -L./$(LIBPATH) -l$(LIBNAME)

main: main.cpp
	$(CC) $(CCFLAGS) $(LDFLAGS) -o main main.cpp && chmod +x main

all: main

run_v1: main
	LD_LIBRARY_PATH=$(LIBPATH) DYLD_LIBRARY_PATH=$(LIBPATH) ./main

run_v2: main
	LD_LIBRARY_PATH=$(LIBPATH_V2) DYLD_LIBRARY_PATH=$(LIBPATH_V2) ./main

clean:
	rm main
