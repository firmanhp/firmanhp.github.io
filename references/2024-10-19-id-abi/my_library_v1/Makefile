CC = g++
CCFLAGS = -std=c++17 -Wextra -shared
OUT = libmylib.so

all: $(OUT)

$(OUT): my_library.cpp
	$(CC) $(CCFLAGS) -o $(OUT) my_library.cpp

clean:
	rm $(OUT)

