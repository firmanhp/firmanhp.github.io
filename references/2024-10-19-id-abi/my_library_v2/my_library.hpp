#pragma once

#include <cstdint>

struct MyObject {
  uint8_t ver_minor;
  uint8_t ver_major;

  void IncrementVersionCalls() {
    ++version_calls_;
  }
  int CountVersionCalls() {
    return version_calls_;
  }

 private:
  uint8_t version_calls_ = 0;
};

extern int GetVersion(MyObject& the_object);
extern int GetObjectSize();

