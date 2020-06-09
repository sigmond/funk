#!/usr/bin/python

##    The FUNK Midi Sequencer
##
##    Copyright (C) 2020  Per Sigmond, per@sigmond.no
##
##    This program is free software: you can redistribute it and/or modify
##    it under the terms of the GNU General Public License as published by
##    the Free Software Foundation, either version 3 of the License, or
##    (at your option) any later version.
##
##    This program is distributed in the hope that it will be useful,
##    but WITHOUT ANY WARRANTY; without even the implied warranty of
##    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
##    GNU General Public License for more details.

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

    def tracks2events(self, tracks):
        message = {'tracks' : []
                   }
        for i, midi_track in enumerate(tracks):
            message['tracks'].append(self.track2events(i, midi_track))
        return message

    def track2events(self, track_index, midi_track):
        event_track = {'index' : track_index,
                       'name' : midi_track.name.strip(),
                       'events' : []
                       }
        msgs = []
        for midi_msg in midi_track:
            msgs.append(midi_msg.dict())

        last_track_tick, events = self.msgs2events(msgs)
        if track_index == 0:
            for e in events:
                print('event ' + repr(e))
        event_track['events'] = events

        return event_track, last_track_tick
    

    def file2events(self, midi_obj, filename):
        if isinstance(midi_obj, MidiFile):
            midi_file = midi_obj
        else:
            raise 'cannot convert midi object'

        last_tick = 0
        
        message = {'filename' : filename,
                   'length_seconds': midi_file.length,
                   'ticks_per_beat': midi_file.ticks_per_beat,
                   'tracks' : []
                   }
        for i, midi_track in enumerate(midi_file.tracks):
            event_track, last_track_tick = self.track2events(i, midi_track)
            message['tracks'].append(event_track)
            if last_track_tick > last_tick:
                last_tick = last_track_tick

        message['length_ticks'] = last_tick
        return message

    def events2file(self, event_file):
        #print('events2file')
        # Do the inverse of file2events()...
        midi_file = mido.MidiFile(
                                  ticks_per_beat=event_file['ticks_per_beat']
                                  )
        for event_track in event_file['tracks']:
            track = self.events2track(event_track)
            
            midi_file.tracks.append(track)
        return midi_file

    def events2track(self, event_track): 
        #print('events2track')
        msgs = []
        #print('event_track ' + repr(event_track))
        for event in event_track['events']:
            #print('event ' + repr(event))
            event_msgs = self.event2msgs(event)
            #print('event_msgs ' + repr(event_msgs))
            for msg in event_msgs:
                #print('msg ' + repr(msg))
                try:
                    midi_msg = mido.Message.from_dict(msg)
                except:
                    midi_msg = mido.MetaMessage.from_dict(msg)
                #print('midi_msg ' + repr(midi_msg))
                msgs.append(midi_msg)
        #print('msgs ' + repr(msgs))
        msgs.sort(key=lambda msg: msg.time)
        #print('sorted msgs ' + repr(msgs))
        track = mido.MidiTrack()
        track.name = event_track['name']
        now = 0
        for msg in msgs:
            delta = msg.time - now
            track.append(msg.copy(time=delta))
            now = msg.time
        return track
    
    def event2msgs(self, event):
        #print('events2msgs event ' + repr(event))
        # generate messages from event (e.g. note_on + note_off)
        # split event into converted messages (still dicts)
        msg = event.copy()
        if event['type'] == 'note':
            msg['type'] = 'note_on'
            msg['time'] = event['start']
            del msg['start']
            del msg['length']
            del msg['end']
            msg_off = msg.copy()
            msg_off['time'] = event['end']
            msg_off['velocity'] = 0
            return [msg, msg_off]
        else:
            msg['time'] = event['start']
            del msg['start']
            del msg['end']
            del msg['length']
            return [msg]

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

    def cut_area(self, event_file, area, remove_space):
        length_ticks = area['tick_stop'] - area['tick_start']
        # loop through affected tracks
        for track_index in range(area['track_start'], area['track_stop']):
            print('cutting area from track ' + repr(track_index))
            event_track = event_file['tracks'][track_index]
            changed_events = []
            # loop through events in event-track, remove events with starttime >= tick_start and < tick_stop
            for event in event_track['events']:
                if ((event['start'] < area['tick_start']) or (event['start'] >= area['tick_stop'])):
                    # if remove_space, subtrack (stop - start) from all events >= tick_stop
                    if remove_space and (event['start'] >= area['tick_stop']):
                        event['start'] -= length_ticks
                        event['end'] -= length_ticks
                    changed_events.append(event)
            event_file['tracks'][track_index]['events'] = changed_events
        return event_file
        
