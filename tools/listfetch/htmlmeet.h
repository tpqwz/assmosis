#ifndef ASSMOSIS_HTMLMEET_H
#define ASSMOSIS_HTMLMEET_H
#include "cJSON.h"
#include <stddef.h>

typedef struct {
  char name[128];
  int weekday, hour, minute, duration;
  char zone[80];
  char platform[16];
  char meeting_id[256];
  char password[32];
  char join[512];
  char notes[1600];
  char contact[256];
  char gender[16];
  char program[32];
  char language[40];
  char location[180];
} HtmlMeet;

typedef void (*HtmlEmit)(void *ctx, const HtmlMeet *row);

/* parser: arts, ceahow, dda, faa, aba, recoveries, eha, coanon.
   spec may set page, page2, and (for tests) file, file2.
   Returns 0 on success. On failure returns -1 and writes err. */
int html_collect(const char *parser, const char *program, cJSON *spec, HtmlEmit emit, void *ctx, char *err, size_t errn);

/* Read saved pages instead of the network. path2 may be NULL. */
int html_parse_path(const char *parser, const char *program, const char *path, const char *path2, HtmlEmit emit, void *ctx, char *err, size_t errn);

int html_self_test(void);
#endif
