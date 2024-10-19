#include "my_library.hpp"

int GetVersion(MyObject& the_object) {
  return the_object.ver_major * 10000 + the_object.ver_minor;
}

int GetObjectSize() {
  return sizeof(MyObject);
}
