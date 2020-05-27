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
    constructor(length_seconds, length_ticks, ticks_per_beat, tracks)
    {
        this._length_seconds = length_seconds;
        this._length_ticks = length_ticks;
        this._ticks = this._length_ticks * 2;
        this._ticks_per_beat = ticks_per_beat;
        this._tracks = tracks;
        this._beats_per_bar = 4;

        this._tracknames = [];
        this.get_tracknames();
        this._tempos = [];
        this.get_tempos();

        this._bars = [];
        this.generate_bars();
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

    get tempos()
    {
        return this._tempos;
    }

    trackname(track_index)
    {
        return this._tracknames[track_index];
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

}
    
class funk_bar
{
    constructor(start_tick, time_signature, ticks_per_beat)
    {
        // TODO: support time signature (for now always 4/4)

        this._start = start_tick;
        this._ticks = ticks_per_beat * 4;
        this._end = start_tick + this._ticks;
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
    
}
        
