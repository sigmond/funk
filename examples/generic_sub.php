<?php

$options = getopt("t:");
$topic = $options['t'];
/*   
    The server waits for messages from the client
    and echoes back the received message
*/
$pull = new ZMQSocket(new ZMQContext(), ZMQ::SOCKET_SUB);
$pull->connect("ipc:///tmp/data_bus_proxy_out");
$pull->setSockOpt(ZMQ::SOCKOPT_SUBSCRIBE, $topic);

while (true) {
    //  Read envelope with address
    $address = $pull->recv();
    //  Read message contents
    $contents = $pull->recv();
    printf ("[%s] %s%s", $address, $contents, PHP_EOL);
}
