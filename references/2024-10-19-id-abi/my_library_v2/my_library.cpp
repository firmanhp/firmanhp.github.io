#include "my_library.hpp"

#include <iostream>

namespace {

void LogVersionCall(int call) {
  std::cout << "GetVersion was called. Count: " << call << '\n';
}

}  // namespace

int MyObject::CountVersionCalls() {
  return version_calls_;
}

void MyObject::IncrementVersionCalls() {
  ++version_calls_;
}

int GetVersion(MyObject& the_object) {
  the_object.IncrementVersionCalls();

  int call_cnt = the_object.CountVersionCalls();
  LogVersionCall(call_cnt);

  return the_object.ver_major * 10000 + the_object.ver_minor;
}
