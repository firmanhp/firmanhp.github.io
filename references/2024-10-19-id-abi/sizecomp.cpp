#include "my_library_v1/my_library.hpp"

#include <iostream>

int main(int argc, char* argv[]) {
  std::cout << "My program thinks that sizeof(MyObject) = " << sizeof(MyObject) << '\n';
  std::cout << "My library thinks that sizeof(MyObject) = " << GetObjectSize() << '\n';
  return 0;
}
