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
        self.undo_tracks_edit_stack = []
        self.redo_tracks_edit_stack = []
        self.cut_tracks_buffer = []
        self.undo_notes_edit_stack = []
        self.redo_notes_edit_stack = []
        self.cut_notes_buffer = []
        self.cut_notes_events = {}
        self.event_id = 1
        self.events = {}
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

    def copy_event(self, event):
        event_copy = event.copy()
        event_copy['id'] = self.event_id
        self.events[self.event_id] = event_copy
        self.event_id += 1
        return event_copy

    def copy_event_track(self, event_track):
        track_copy = event_track.copy()
        track_copy['events'] = []
        for event in event_track['events']:
            track_copy['events'].append(self.copy_event(event))
        return track_copy

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
            del msg['id']
            msg_off = msg.copy()
            msg_off['time'] = event['end']
            msg_off['velocity'] = 0
            return [msg, msg_off]
        else:
            msg['time'] = event['start']
            del msg['start']
            del msg['end']
            del msg['length']
            del msg['id']
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
                event['id'] = self.event_id
                self.events[self.event_id] = event
                self.event_id += 1
                events.append(event)

        return abstime, sorted(events, key = lambda i: i['start'])

    def cut_tracks_area(self, event_file, area, remove_space):
        print('cut_tracks_area')
        affected_tracks = []
        length_ticks = area['tick_stop'] - area['tick_start']
        # loop through affected tracks
        original_tracks = []

        # remember cut area for any later paste (move)
        del self.cut_tracks_buffer[:]
        for track_index in range(area['track_start'], area['track_stop']):
            print('cutting area from track ' + repr(track_index))
            event_track = event_file['tracks'][track_index]
            original_tracks.append(self.copy_event_track(event_track))
            
            changed_events = []
            cut_events = []
            # loop through events in event-track, remove events with starttime >= tick_start and < tick_stop
            for event in event_track['events']:
                if ((event['start'] < area['tick_start']) or (event['start'] >= area['tick_stop'])):
                    # if remove_space, subtract (stop - start) from all events >= tick_stop
                    if remove_space and (event['start'] >= area['tick_stop']):
                        event['start'] -= length_ticks
                        event['end'] -= length_ticks
                    changed_events.append(event)
                else:
                    cut_events.append(event)
            event_file['tracks'][track_index]['events'] = changed_events
            affected_tracks.append(event_file['tracks'][track_index])
            self.cut_tracks_buffer.append(cut_events)
        self.undo_tracks_edit_stack.insert(0, original_tracks)
        return affected_tracks
        
    def paste_tracks_area(self, event_file, from_area, to_area, insert_space, merge, cut_or_copy):
        affected_tracks = []
        # - in general, if from-area > to-area, paste into to-area only
        # - if from-ticks-length < to-tick-length, do a repetitive paste
        # - if from-tracks-length < to-track-length, only paste from-track-length (no repetition)
        from_ticks_length = from_area['tick_stop'] - from_area['tick_start']
        to_ticks_length = to_area['tick_stop'] - to_area['tick_start']
        from_tracks_length = from_area['track_stop'] - from_area['track_start']
        to_tracks_length = to_area['track_stop'] - to_area['track_start']
        
        if from_tracks_length < to_tracks_length:
            to_area['track_stop'] -= (to_tracks_length - from_tracks_length)
            to_tracks_length = to_area['track_stop'] - to_area['track_start']
        elif to_tracks_length < from_tracks_length:
            from_area['track_stop'] -= (from_tracks_length - to_tracks_length)
            from_tracks_length = from_area['track_stop'] - from_area['track_start']

        if to_ticks_length < from_ticks_length:
            from_area['tick_stop'] -= (from_ticks_length - to_ticks_length)
            from_ticks_length = from_area['tick_stop'] - from_area['tick_start']
            
        original_tracks = []

        # loop through from-area and copy all from-events first
        paste_tracks = []
        if cut_or_copy == 'cut':
            for cut_events in self.cut_tracks_buffer:
                events_copied = []
                for event in cut_events:
                    events_copied.append(self.copy_event(event))
                paste_tracks.append(events_copied)
        else:
            for from_track_index in range(from_area['track_start'], from_area['track_stop']):
                from_track = event_file['tracks'][from_track_index]
                events_copied = []
                for event in from_track['events']:
                    if (event['start'] >= from_area['tick_start']) and (event['start'] < from_area['tick_stop']):
                        events_copied.append(self.copy_event(event))
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
                            rep_event = self.copy_event(event)
                            rep_event['start'] = dest_start
                            rep_event['end'] += forward_ticks
                            paste_tracks[index].append(rep_event)
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
            to_event_track = event_file['tracks'][to_track_index]

            # for undo:
            original_tracks.append(self.copy_event_track(to_event_track))

            # insert?
            if insert_space:
                # add (stop - start) to all to-events >= tick_start
                to_events_after_insert = []
                for event in to_event_track['events']:
                    if event['start'] >= to_area['tick_start']:
                        event['start'] += to_ticks_length
                        event['end'] += to_ticks_length
                    to_events_after_insert.append(event)
            else:
                to_events_after_insert = to_event_track['events']

            # remove?
            if not merge:
                # remove all to-events >= tick_start and < tick_stop
                to_events_after_remove = []
                for event in to_events_after_insert:
                    if ((event['start'] < to_area['tick_start']) or (event['start'] >= to_area['tick_stop'])):
                        to_events_after_remove.append(event)
            else:
                to_events_after_remove = to_events_after_insert

            # to_events_after_remove is now prepared for pasting
            to_events_after_remove.extend(paste_tracks[paste_tracks_index])
            event_file['tracks'][to_track_index]['events'] = sorted(to_events_after_remove, key = lambda i: i['start'])
            affected_tracks.append(event_file['tracks'][to_track_index])

            paste_tracks_index += 1
            to_track_index += 1
            
        self.undo_tracks_edit_stack.insert(0, original_tracks)
        return affected_tracks
        
    def undo_tracks_edit(self, event_file):
        if not self.undo_tracks_edit_stack:
            return []
        undo_tracks = self.undo_tracks_edit_stack.pop(0)
        redo_tracks = []
        for track in undo_tracks:
            redo_tracks.append(event_file['tracks'][track['index']])
            event_file['tracks'][track['index']] = track
        self.redo_tracks_edit_stack.insert(0, redo_tracks)
        return undo_tracks

    def redo_tracks_edit(self, event_file):
        if not self.redo_tracks_edit_stack:
            return []
        redo_tracks = self.redo_tracks_edit_stack.pop(0)
        undo_tracks = []
        for track in redo_tracks:
            undo_tracks.append(event_file['tracks'][track['index']])
            event_file['tracks'][track['index']] = track
        self.undo_tracks_edit_stack.insert(0, undo_tracks)
        return redo_tracks

    
    def select_notes_area(self, event_file, track_index, area, notes):
        print('select_notes_area')
        selected_events = []
        event_track = event_file['tracks'][track_index]
        if area:
            for event in event_track['events']:
                if (event['start'] >= area['tick_start']) and (event['start'] < area['tick_stop']) and (event['note'] >= area['note_start']) and (event['note'] < area['note_stop']):
                    selected_events.append(event['id'])
                if event['start'] >= area['tick_stop']:
                    break
        selected_events.extend(notes)
        return selected_events

    def cut_notes(self, event_file, track_index, notes):
        print('cut_notes')
        affected_tracks = []
        # loop through affected tracks
        original_tracks = []

        print('cutting events from track ' + repr(track_index))
        event_track = event_file['tracks'][track_index]
        original_tracks.append(self.copy_event_track(event_track))
            
        changed_events = []
        self.cut_notes_events = {}
        
        # loop through events in event-track, remove events with same id as notes
        for event in event_track['events']:
            if event['id'] in notes:
                self.cut_notes_events[event['id']] = event
                del self.events[event['id']]
            else:
                changed_events.append(event)                
        event_file['tracks'][track_index]['events'] = changed_events
        affected_tracks.append(event_file['tracks'][track_index])
        
        self.undo_tracks_edit_stack.insert(0, original_tracks)
        return affected_tracks

    def paste_notes(self, event_file, track_index, to_tick, to_note, cut_or_copy, notes):
        print('paste_notes')
        affected_tracks = []
        # loop through affected tracks
        original_tracks = []

        print('pasting events to track ' + repr(track_index))
        event_track = event_file['tracks'][track_index]
        original_tracks.append(self.copy_event_track(event_track))

        # move in time and note
        # find events
        note_events = []
        for id in notes:
            if cut_or_copy == 'copy':
                note_events.append(self.copy_event(self.events[id]))
            else:
                note_events.append(self.copy_event(self.cut_notes_events[id]))

        sorted_events = sorted(note_events, key = lambda i: i['start'])
        tick_shift = to_tick - sorted_events[0]['start']
        if to_note >= 0:
            highest_note = 0
            for event in sorted_events:
                if ('note' in event) and (event['note'] > highest_note):
                    highest_note = event['note']
            note_shift = to_note - highest_note
        else:
            note_shift = 0
        events_to_paste = []
        for event in sorted_events:
            event['start'] += tick_shift
            event['end'] += tick_shift
            if 'note' in event:
                event['note'] += note_shift
            event['id'] = self.event_id
            self.events[self.event_id] = event
            self.event_id += 1
            events_to_paste.append(event)
            
        changed_events = event_file['tracks'][track_index]['events']
        changed_events.extend(events_to_paste)        
        event_file['tracks'][track_index]['events'] = sorted(changed_events, key = lambda i: i['start'])
        affected_tracks.append(event_file['tracks'][track_index])
        
        self.undo_tracks_edit_stack.insert(0, original_tracks)
        return affected_tracks

    def set_note_end(self, event_file, track_index, note_id, end_tick):
        print('set_note_end')
        affected_tracks = []
        # loop through affected tracks
        original_tracks = []

        event_track = event_file['tracks'][track_index]
        original_tracks.append(self.copy_event_track(event_track))
            
        changed_events = []
        
        # loop through events in event-track, adjust event with same id as note
        for event in event_track['events']:
            if event['id'] == note_id:
                changed_event = self.copy_event(event)
                changed_event['end'] = end_tick
                del self.events[note_id]
                changed_event['id'] = self.event_id
                self.events[self.event_id] = changed_event
                self.event_id += 1
                changed_events.append(changed_event)
            else:
                changed_events.append(event)                
        event_file['tracks'][track_index]['events'] = sorted(changed_events, key = lambda i: i['start'])
        affected_tracks.append(event_file['tracks'][track_index])
        
        self.undo_tracks_edit_stack.insert(0, original_tracks)
        return affected_tracks


    def undo_notes_edit(self, event_file):
        print('undo_notes_edit')
        return self.undo_tracks_edit(event_file)

    def redo_notes_edit(self, event_file):
        print('redo_notes_edit')
        return self.redo_tracks_edit(event_file)
