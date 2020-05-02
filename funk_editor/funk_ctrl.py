import funk_zmq
import funk_midi

pub_socket = None
ctrl_socket = None
midi_socket = None

def midi_start_play_file():
    msg = {'command' : 'load',
           'what' : 'file',
           'midi_obj' : funk_midi.midi_file
           }
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

    
    msg = {'command' : 'play'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_stop_play():
    msg = {'command' : 'stop'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

mute = False

def midi_mute_unmute():
    global mute
    
    if not mute:
        msg = {'command' : 'channel',
               'muted' : [9]
               }
        mute = True
    else:
        msg = {'command' : 'channel',
               'muted' : []
               }
        mute = False
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_panic():
    msg = {'command' : 'panic'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_reset():
    msg = {'command' : 'reset'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)
   
