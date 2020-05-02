import zmq

def connect_subscriber(path):
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect (path)
    return socket

def connect_publisher(path):
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.connect (path)
    return socket

def subscribe(socket, topic):
    socket.setsockopt(zmq.SUBSCRIBE, topic)

def send_ctrl_msg(socket, topic, ctrl_msg):
    print('Sending ctrl message [' + repr(topic) + '] ' + repr(ctrl_msg))
    socket.send_string(topic, flags=zmq.SNDMORE)
    socket.send_pyobj(ctrl_msg)
