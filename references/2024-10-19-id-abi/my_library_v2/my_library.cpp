#include "my_library.hpp"

#include <iostream>

int GetVersion(MyObject& the_object) {
  the_object.IncrementVersionCalls();

  int call_cnt = the_object.CountVersionCalls();
  std::cout << "GetVersion was called. Count: " << call_cnt << '\n';

  return the_object.ver_major * 10000 + the_object.ver_minor;
}

int GetObjectSize() {
  return sizeof(MyObject);
}
