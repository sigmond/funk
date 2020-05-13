#include <stdio.h>
#include <unistd.h>


int main(int argc, char **argv)
{
    printf("Starting bus\n");
    if (!fork())
    {
        execl("data_bus_proxy/data_bus_proxy", "data_bus_proxy", NULL);
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
