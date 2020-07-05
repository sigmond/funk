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

class funk_song 
{
    constructor(filename, ticks_per_beat, tracks)
    {
        this._filename = filename;
        this._ticks_per_beat = ticks_per_beat;
        this._beats_per_bar = 4;
        this._tracks = [];

        this.update_tracks(tracks);

        this._note_playing = null;
        this._channel_playing = null;
        this._note_off_timer_function = null;
    }

    update_filename(filename)
    {
        this._filename = filename;
    }

    update_tracks(tracks, total_num_tracks)
    {
        if (total_num_tracks < this._tracks.length)
        {
            var num_remove = this._tracks.length - total_num_tracks;
            for (var i = 0; i < num_remove; i++)
            {
                this._tracks.pop();
            }
        }

        for (const track of tracks)
        {
            this._tracks[track.index] = track;
        }
        
        this._tracknames = [];
        this.get_tracknames();
        this._channels = [];
        this.get_channels();
        this._patches = [];
        this.get_patches();
        this._tempos = [];
        this.get_tempos();
        this.get_song_length_ticks();
        this._ticks = this._length_ticks * 2;

        this._bars = [];
        this.generate_bars();
    }

    get_track_length_ticks(track)
    {
        return track.events[track.events.length - 1].end;
    }

    get_song_length_ticks()
    {
        var length_ticks = 0;
        for (const track of this._tracks)
        {
            length_ticks = Math.max(length_ticks, this.get_track_length_ticks(track));
        }
        this._length_ticks = length_ticks;
    }

    get filename()
    {
        return this._filename;
    }

    get length_seconds()
    {
        return this._length_seconds;
    }

    get length_ticks()
    {
        return this._length_ticks;
    }

    get ticks()
    {
        return this._ticks;
    }

    get ticks_per_beat()
    {
        return this._ticks_per_beat;
    }

    get tracks()
    {
        return this._tracks;
    }

    get bars()
    {
        return this._bars;
    }

    get tracknames()
    {
        return this._tracknames;
    }

    get channels()
    {
        return this._channels;
    }

    get patches()
    {
        return this._patches;
    }

    get tempos()
    {
        return this._tempos;
    }

    is_drum_channel(track_index)
    {
        return (this._channels[track_index] == 9);
    }

    bpm()
    {
        return parseInt((60 * 1000000) / this.tempos[0]);
    }

    trackname(track_index)
    {
        return this._tracknames[track_index];
    }

    patch(track_index)
    {
        return this._patches[track_index];
    }
    
    generate_bars()
    {
        if (this._bars.length > 0)
        {
            delete this._bars;
            this._bars = []
        }
        
        // TODO: check track 0 for time signatures (meterchange)
        var ticks_per_bar = this._ticks_per_beat * this._beats_per_bar;
        var ticks;
        for (ticks = 0; ticks < this._ticks; ticks++)
        {
            if ((ticks % ticks_per_bar) == 0)
            {
                this._bars.push(new funk_bar(ticks, null, this._ticks_per_beat));
            }
        }

    }

    get_tracknames()
    {
        for (const track of this._tracks)
        {
            var name = "";
            
            for (const event of track['events'])
            {
                if (event['type'] == 'track_name')
                {
                    name = event['name'];
                    break;
                }
            }
            this._tracknames.push(name);
        }
    }

    get_tempos()
    {
        var tempo;
        
        // TODO: gather all tempos in track 0
        for (const event of this._tracks[0]['events'])
        {
            if (event['type'] == 'set_tempo')
            {
                tempo = event['tempo'];
                break;
            }
        }
        this._tempos.push(tempo);
    }

    get_channels()
    {
        for (const track of this._tracks)
        {
            var channel = -1;

            for (const event of track['events'])
            {
                if (event['channel'] !== undefined)
                {
                    channel = event['channel'];
                    break;
                }
            }
            this._channels.push(channel);
        }
    }


    get_patches()
    {
        for (const track of this._tracks)
        {
            var bank = -1;
            var program = -1;
            
            for (const event of track['events'])
            {
                if ((event['type'] == 'control_change') && (event['control'] == 0))
                {
                    bank = event['value'];
                }

                if (event['type'] == 'program_change')
                {
                    program = event['program'];
                }
            }
            this._patches.push({'bank' : bank, 'program' : program});
        }
    }


    tick2second(tick)
    {
        var seconds_per_tick;
        
        // TODO: go through all tempos to calculate time of this tick
        seconds_per_tick = (parseInt(this._tempos[0]) / 1000000.0) / this._ticks_per_beat;
        return tick * seconds_per_tick;
    }

    second2tick(second)
    {
        var seconds_per_tick;
        
        // TODO: go through all tempos to calculate time of this tick
        seconds_per_tick = (parseInt(this._tempos[0]) / 1000000.0) / this._ticks_per_beat;
        return parseInt(second / seconds_per_tick);
    }

    play_track_notes(track_index, notes, velocity, length = 200)
    {
        for (const note of notes)
        {
            play_note(this._channels[track_index], note, velocity);
        }
        
        if (length != 0)
        {
            this.start_note_off_timer(this._channels[track_index], notes, length);
        }
    }

    start_note_off_timer(channel, notes, length_ms)
    {
        global_song_channel_playing = channel;
        global_song_notes_playing = notes;
        this._note_off_timer_function = setTimeout(this.note_off, length_ms);
    }
    
    note_off() {
        for (const note of global_song_notes_playing)
        {
            play_note(global_song_channel_playing, note, 0);
        }
    }    
}
    
class funk_bar
{
    constructor(start_tick, time_signature, ticks_per_beat)
    {
        // TODO: support time signature (for now always 4/4)

        this._start = start_tick;
        this._ticks = ticks_per_beat * 4;
        this._end = start_tick + this._ticks;

        this._beats = 4;
    }

    get start() 
    {
        return this._start;
    }
    
    get end() 
    {
        return this._end;
    }
    
    get ticks() 
    {
        return this._ticks;
    }
    
    get beats() 
    {
        return this._beats;
    }
    
}
        
