#include "my_library_v1/my_library.hpp"

#include <iostream>

int main(int argc, char* argv[]) {
  MyObject the_object = {
    .ver_minor = 0xCD,  // 0xAD = 205
    .ver_major = 0xAB, // 0xDE = 171
  };
  int version = GetVersion(the_object);
  std::cout << "Version: " << version << '\n';
  return 0;
}