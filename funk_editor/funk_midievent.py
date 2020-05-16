#!/usr/bin/python
"""                                                                            
Convert MIDI objects to json messages


"""
from __future__ import print_function, division
import sys
import mido
import time
from mido import MidiFile


class funk_midievent():
    def __init__(self):
        pass

    def midi2events(self, midi_obj):
        if isinstance(midi_obj, MidiFile):
            midi_file = midi_obj
        else:
            raise 'cannot convert midi object'

        last_tick = 0
        
        message = {'length_seconds': midi_file.length,
                   'ticks_per_beat': midi_file.ticks_per_beat,
                   'tracks' : []
                   }
        for i, midi_track in enumerate(midi_file.tracks):
            track = {'index' : i,
                     'name' : midi_track.name.strip(),
                     'events' : []
                     }
            msgs = []
            for midi_msg in midi_track:
                msgs.append(midi_msg.dict())

            last_track_tick, events = self.msgs2events(msgs)
            if i == 0:
                for e in events:
                    print('event ' + repr(e))
            track['events'] = events

            if last_track_tick > last_tick:
                last_tick = last_track_tick
            
            message['tracks'].append(track)

        message['length_ticks'] = last_tick
        return message

    def msgs2events(self, msgs):
        events = []
        notes = { 0: dict(),
                  1: dict(),
                  2: dict(),
                  3: dict(),
                  4: dict(),
                  5: dict(),
                  6: dict(),
                  7: dict(),
                  8: dict(),
                  9: dict(),
                  10: dict(),
                  11: dict(),
                  12: dict(),
                  13: dict(),
                  14: dict(),
                  15: dict()
                  }
        abstime = 0
        for msg in msgs:
            event = None
#            print('msg ' + repr(msg))
            abstime = abstime + msg['time']
            if msg['type'] == 'note_on':
                if msg['velocity'] != 0:
                    try:
                        del(notes[msg['channel']][msg['note']])
                    except:
                        pass
                    note_event = msg.copy()
                    note_event['type'] = 'note'
                    note_event['start'] = abstime
                    notes[msg['channel']][msg['note']] = note_event
                else:
                    try:
                        event = notes[msg['channel']][msg['note']].copy()
                        event['end'] = abstime
                        del(event['time'])
                        event['length'] = event['end'] - event['start']
                        del(notes[msg['channel']][msg['note']])
                    except:
                        pass
            elif msg['type'] == 'note_off':
                try:
                    event = notes[msg['channel']][msg['note']].copy()
                    event['end'] = abstime
                    del(event['time'])
                    event['length'] = event['end'] - event['start']
                    del(notes[msg['channel']][msg['note']])
                except:
                    pass
            elif msg['type'] == 'end_of_track':
                pass
            else:
                event = msg.copy()
                event['start'] = abstime
                event['end'] = abstime
                del(event['time'])
                event['length'] = 0
#            print('event ' + repr(event))
            if event != None:
                events.append(event)

        return abstime, sorted(events, key = lambda i: i['start']) 

        
        
