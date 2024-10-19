#pragma once

#include <cstdint>

struct MyObject {
  uint8_t ver_minor;
  uint8_t ver_major;
};

extern int GetVersion(MyObject& the_object);
extern int GetObjectSize();
