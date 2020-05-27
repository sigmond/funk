/*
    The FUNK Midi Sequencer

    Copyright (C) 2020  Per Sigmond, per@sigmond.no

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/
#include "data_bus_proxy.h"
#include <getopt.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/types.h>
#include <unistd.h>
#include <signal.h>
#include <assert.h>
#include "data_bus_proxy_version.h"

static char *in_path = DATA_BUS_PROXY_DEFAULT_SUB_PATH;
static char *out_path = DATA_BUS_PROXY_DEFAULT_PUB_PATH;
static void *frontend;
static void *backend;
static void *context;
static bool verbose = false;
static bool usr1_received = false;
static bool hup_received = false;

static void read_options(int argc, char **argv);
static void usage(char *prog);

static void terminate(int exitval)
{
    zmq_close (frontend);
    zmq_close (backend);
    zmq_ctx_destroy (context);

    exit(exitval);
}


static void handle_term(int signum)
{
    fprintf(stderr, "WARNING: Terminated by signal (%d).\n", signum);
    terminate(signum);
}

static void handle_hup(int signum)
{
    fprintf(stderr, "INFO: Got signal (%d).\n", signum);
    hup_received = true;
}

static void handle_usr1(int signum)
{
    fprintf(stderr, "INFO: Got signal (%d).\n", signum);
    usr1_received = true;
}

static void heartbeat(void)
{
    printf("INFO: heartbeat\n");
}

int main (int argc, char **argv)
{
    context = zmq_ctx_new ();

    read_options(argc, argv);
    
    signal(SIGTERM, handle_term);
    signal(SIGINT, handle_term);
    signal(SIGHUP, handle_hup);
    signal(SIGUSR1, handle_usr1);
    
    //  Socket facing clients
    frontend = zmq_socket (context, ZMQ_XSUB);
    if (verbose)
    {
        printf("binding frontend to '%s'\n", in_path);
    }
    int rc = zmq_bind (frontend, in_path);
    assert (rc == 0);

    //  Socket facing services
    backend = zmq_socket (context, ZMQ_XPUB);
    if (verbose)
    {
        printf("binding backend to '%s'\n", out_path);
    }
    rc = zmq_bind (backend, out_path);
    assert (rc == 0);

    
    //  Start the proxy
    if (verbose)
    {
        printf("entering proxy loop...\n");
    }

    do
    {
        usr1_received = false;
        hup_received = false;
        
        zmq_proxy (frontend, backend, NULL);

        if (usr1_received)
        {
            heartbeat();
        }
    } while (usr1_received || hup_received);

    terminate(-1);
    
    return -1;
}


static void version(char *prog)
{
    fprintf(stderr, "%s version %s (%s), built %s %s\n",
            prog, DATA_BUS_PROXY_VERSION, RELEASE_VERSION, __DATE__, __TIME__);
}


static void usage(char *prog)
{
    version(prog);
    fprintf(stderr, "Usage: %s -h\n", prog);
    fprintf(stderr, "Usage: %s -v\n", prog);
    fprintf(stderr, "Usage: %s [-V]\n", prog);
    fprintf(stderr, "Long options:\n");
    fprintf(stderr, "    [--input-socket-path <socket-path>]\n");
    fprintf(stderr, "    [--output-socket-path <socket-path>]\n");
}


static void read_options(int argc, char **argv)
{
    int opt;
    int long_index = 0;
    
#define LOI_INPUT_SOCKET_PATH 0
#define LOI_OUTPUT_SOCKET_PATH 1
    
    struct option long_options[] =
        {
            {"input-socket-path", 1, 0, 0},
            {"output-socket-path", 1, 0, 0},
            {0, 0, 0, 0}
        };
    

    while ((opt = getopt_long(argc, argv, "hvV", long_options, &long_index)) != -1)
    {
        switch (opt) {
            case 0:
/*                 printf("%s = '%s'\n", long_options[long_index].name, optarg); */
                switch (long_index)
                {
                    case LOI_INPUT_SOCKET_PATH:
                        in_path = strdup(optarg);
                        break;
                    case LOI_OUTPUT_SOCKET_PATH:
                        out_path = strdup(optarg);
                        break;
                    default:
                        usage(argv[0]);
                        exit(-1);
                }
                break;
            case 'V':
                verbose = true;
                break;
            case 'h':
                usage(argv[0]);
                exit(0);
            case 'v':
                version(argv[0]);
                exit(0);
            default: /* '?' */
                usage(argv[0]);
                exit(-1);
        }
    }
}
