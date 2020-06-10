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
        # TODO: for undo:
        # original_tracks = []
        for track_index in range(area['track_start'], area['track_stop']):
            print('cutting area from track ' + repr(track_index))
            event_track = event_file['tracks'][track_index]
            # TODO: for undo:
            #original_tracks.append(event_track.copy())
            
            changed_events = []
            # loop through events in event-track, remove events with starttime >= tick_start and < tick_stop
            for event in event_track['events']:
                if ((event['start'] < area['tick_start']) or (event['start'] >= area['tick_stop'])):
                    # if remove_space, subtract (stop - start) from all events >= tick_stop
                    if remove_space and (event['start'] >= area['tick_stop']):
                        event['start'] -= length_ticks
                        event['end'] -= length_ticks
                    changed_events.append(event)
            event_file['tracks'][track_index]['events'] = changed_events
        return event_file
        
    def paste_area(self, event_file, from_area, to_area, insert_space, merge):
        # - in general, if from-area > to-area, paste into to-area only
        # - if from-ticks-length < to-tick-length, do a repetitive paste
        # - if from-tracks-length < to-track-length, only paste from-track-length (no repetition)
        from_ticks_length = from_area['tick_stop'] - from_area['tick_start']
        to_ticks_length = to_area['tick_stop'] - to_area['tick_start']
        from_tracks_length = from_area['track_stop'] - from_area['track_start']
        to_tracks_length = to_area['track_stop'] - to_area['track_start']
        
        if from_tracks_length < to_tracks_length:
            to_area['track_stop'] -= (to_tracks_length - from_tracks_length)
            to_tracks_length -= (to_tracks_length - from_tracks_length)
        elif to_tracks_length < from_tracks_length:
            from_area['track_stop'] -= (from_tracks_length - to_tracks_length)
            from_tracks_length -= (from_tracks_length - to_tracks_length)

        if to_ticks_length < from_ticks_length:
            from_area['ticks_stop'] -= (from_ticks_length - to_ticks_length)
            from_ticks_length -= (from_ticks_length - to_ticks_length)
            
        # TODO: for undo:
        # original_tracks = []

        paste_tracks = []
        # loop through from-area and copy all from-events first
        for from_track_index in range(from_area['track_start'], from_area['track_stop']):
            from_track = event_file['tracks'][from_track_index]
            events_copied = []
            for event in from_track['events']:
                if (event['start'] >= from_area['tick_start']) and (event['start'] < from_area['tick_stop']):
                    events_copied.append(event)
                if event['start'] >= from_area['tick_stop']:
                    break
            paste_tracks.append(events_copied)

        # repetitive copy needed?
        if from_ticks_length < to_ticks_length:
            # yes
            source_tracks = paste_tracks[:]
            for index in range(0, from_tracks_length):
                copy_num = 1
                forward_ticks = from_ticks_length * copy_num
                while forward_ticks < to_ticks_length:
                    for event in source_tracks[index]:
                        dest_start = event['start'] + forward_ticks
                        if dest_start < (from_area['tick_start'] + to_ticks_length):
                            event['start'] = dest_start
                            event['end'] += forward_ticks
                            paste_tracks[index].append(event)
                    copy_num += 1
                    forward_ticks = from_ticks_length * copy_num

        # move copied events to right time in the to-track
        for index in range(0, from_tracks_length):
            ticks_diff_from_to = to_area['tick_start'] - from_area['tick_start']
            for event in paste_tracks[index]:
                event['start'] += ticks_diff_from_to
                event['end'] += ticks_diff_from_to
            
        # paste_tracks are prepared and now exactly fills to-area
        
        # loop through to area
        paste_tracks_index = 0
        to_track_index = to_area['track_start']
        while to_track_index < to_area['track_stop']:
            print('pasting from track ' + repr(from_track_index) + ' into track ' + repr(to_track_index))
            from_event_track = event_file['tracks'][from_track_index]
            to_event_track = event_file['tracks'][to_track_index]

            # TODO: for undo:
            #original_tracks.append(to_event_track[:])

            # insert?
            to_events_after_insert = []
            if insert_space:
                # add (stop - start) to all to-events >= tick_start
                for event in to_event_track['events']:
                    if event['start'] > to_area['tick_start']:
                        event['start'] += to_length_ticks
                        event['end'] += to_length_ticks
                    to_events_after_insert.append(event)
            else:
                to_events_after_insert = to_event_track['events'][:]

            # remove?
            to_events_after_remove = []
            if not merge:
                # remove all to-events >= tick_start and < tick_stop
                for event in to_events_after_insert:
                    if ((event['start'] < to_area['tick_start']) or (event['start'] >= to_area['tick_stop'])):
                        to_events_after_remove.append(event)
            else:
                to_events_after_remove = to_events_after_insert[:]

            # to_events_after_remove is now prepared for pasting
            event_file['tracks'][to_track_index]['events'] = to_events_after_remove
            event_file['tracks'][to_track_index]['events'].extend(paste_tracks[paste_tracks_index])

            paste_tracks_index += 1
            to_track_index += 1
            
        return event_file
        
