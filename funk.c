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
#include <stdio.h>
#include <unistd.h>


int main(int argc, char **argv)
{
    printf("Starting bus\n");
    if (!fork())
    {
        execl("funk_proxy/funk_proxy", "funk_proxy", NULL);
    }

    sleep(1);
    
    printf("Starting controller\n");
    if (!fork())
    {
        execl("funk_controller/funk_controller", "funk_controller", NULL);
    }

    printf("Starting outputter\n");
    if (!fork())
    {
        execl("funk_outputter/funk_outputter", "funk_outputter", NULL);
    }
    
    printf("Starting capturer\n");
    if (!fork())
    {
        execl("funk_capturer/funk_capturer", "funk_capturer", NULL);
    }
    
    printf("Starting player\n");
    if (!fork())
    {
        execl("funk_player/funk_player", "funk_player", NULL);
    }

    printf("Starting recorder\n");
    if (!fork())
    {
        execl("funk_recorder/funk_recorder", "funk_recorder", NULL);
    }

    printf("Starting editor\n");
    if (!fork())
    {
        execl("funk_editor/funk_editor", "funk_editor", NULL);
    }

    while(1)
    {
        sleep(1);
    }

    return 0;
}
