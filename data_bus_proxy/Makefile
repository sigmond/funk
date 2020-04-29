TARGET=data_bus_proxy

ifeq ($(RELEASE_VERSION),)
DEFINES+=-DRELEASE_VERSION="\"Development Version\""
else
DEFINES+=-DRELEASE_VERSION="\"Release v$(subst _,.,$(RELEASE_VERSION))\""
endif

SRC=.

C_SRCS += \
$(SRC)/data_bus_proxy.c \


OBJS += \
data_bus_proxy.o \

C_DEPS += \
data_bus_proxy.d \

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

print_version: print_version.c data_bus_proxy_version.h
	gcc print_version.c -o print_version

clean:
	$(RM) -f $(TARGET) $(OBJS) $(C_DEPS) print_version


release: all
ifeq ($(RELEASE_VERSION),)
	@echo "ERROR: RELEASE_VERSION not set"
	exit 1
endif
	mkdir -p ../../../Release_V$(RELEASE_VERSION)
	cp data_bus_proxy ../../../Release_V$(RELEASE_VERSION)/data_bus_proxy_v$(shell ./print_version)
	cp README_data_bus_proxy.txt ../../../Release_V$(RELEASE_VERSION)/README_data_bus_proxy_v$(shell ./print_version).txt
	echo "- data_bus_proxy_v$(shell ./print_version)" >> ../../../Release_V$(RELEASE_VERSION)/tag_message.txt
