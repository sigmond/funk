TARGET=funk_proxy

ifeq ($(RELEASE_VERSION),)
DEFINES+=-DRELEASE_VERSION="\"Development Version\""
else
DEFINES+=-DRELEASE_VERSION="\"Release v$(subst _,.,$(RELEASE_VERSION))\""
endif

SRC=.

C_SRCS += \
$(SRC)/funk_proxy.c \


OBJS += \
funk_proxy.o \

C_DEPS += \
funk_proxy.d \

-include $(C_DEPS)

CFLAGS_STD=-std=gnu99
#CFLAGS_COVERAGE=-ftest-coverage -fprofile-arcs
CFLAGS_COVERAGE=
#CFLAGS_GPROF=-pg
CFLAGS_GPROF=
OPTIMIZE=0
WARNINGS=-Wall -Wstrict-prototypes -Wmissing-prototypes -Wno-unused-function
CFLAGS=$(DEFINES) $(CFLAGS_STD) $(CFLAGS_COVERAGE) $(CFLAGS_GPROF) $(WARNINGS)

LIBS=-lzmq


all: $(TARGET) print_version

$(TARGET): $(OBJS)
	$(CC) -o $@ $(OBJS) $(CFLAGS_GPROF) $(LIBS)

print_version: print_version.c funk_proxy_version.h
	gcc print_version.c -o print_version

clean:
	$(RM) -f $(TARGET) $(OBJS) $(C_DEPS) print_version


