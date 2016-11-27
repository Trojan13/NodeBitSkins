#include <Array.au3>
ClipPut(_ArrayToString(_ArrayUnique(StringSplit(ClipGet(),",")),","))