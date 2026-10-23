#ifndef ASSMOSIS_TZ_H
#define ASSMOSIS_TZ_H
#include <time.h>
int zone_known(const char *name);
/* Wall clock in an IANA zone. 0 if the zone is not in the embedded database. */
int zone_local(const char *name, time_t epoch, struct tm *out);
#endif
