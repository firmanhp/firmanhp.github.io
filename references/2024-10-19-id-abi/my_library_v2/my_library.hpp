#pragma once

#include <cstdint>

struct MyObject {
  uint8_t ver_minor;
  uint8_t ver_major;

  void IncrementVersionCalls();
  int CountVersionCalls();

 private:
  uint8_t version_calls_ = 0;
};

extern int GetVersion(MyObject& the_object);
