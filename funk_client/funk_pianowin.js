class pianowin
{
    constructor(info_frame, tracks_frame, song)
    {
        this._song = song;
        this._ruler_height = 30;
        this._track_y = this._ruler_height;
        this._pixels_per_tick = 0.5;
        this._note_height = 14;
        this._info_width = 100;
        this._white_notes = [0, 2, 4, 5, 7, 9, 11];
        this._white_note_height = (this._note_height * 12) / this._white_notes.length;
        this._white_key_num = [];

        this._num_notes = 128;

        this._bg_color = "blue";
        this._white_key_color = "white";
        this._black_key_color = "black";        
        this._white_key_highlight_color = "grey";
        this._black_key_highlight_color = "grey"; 
        this._note_color = "lightgreen";
        
        this._playhead_xpos = 0;
        this._playhead_ticks = 0;
        
        this._tracks_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        this._tracks_canvas.setAttribute("class", "pianowin-tracks-canvas");
        this._tracks_canvas.id = 'pianowin_tracks_canvas';
        
        this._tracks_frame = tracks_frame;
        
        this._tracks_frame.appendChild(this._tracks_canvas);
        
        this._tracks_canvas.addEventListener('click', this.tracks_clickhandler);
        this._tracks_canvas.addEventListener('mousemove', this.tracks_mousemovehandler);
        
        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._tracks_width = wh.width;
        
        this._info_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        this._info_canvas.setAttribute("class", "pianowin-info-canvas");
        this._info_canvas.id = 'pianowin_info_canvas';
        
        info_frame.appendChild(this._info_canvas);
        
        this._info_canvas.addEventListener('click', this.info_clickhandler);
        this._info_canvas.addEventListener('mousemove', this.info_mousemovehandler);
        
        
        this._xgrid_highlight_element = null;
        this._key_highlight_element = null;
        this._key_highlight_type = null;
    }
    

    tracks_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        
        pianowin_object.tracks_handle_click(x, y);
    }
    
    tracks_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.tracks_handle_mouse_move(x, y);
    }
    

    tracks_handle_click(x, y)
    {
        if (y < this._ruler_height)
        {
            if (trackwin_object._playing)
            {
                stop();
                trackwin_object._playing = false;
                return;
            }
            
            var tick = parseInt(x / this._pixels_per_tick);

            // TODO: snap to xgrid
            
            output("play: start = " + tick);
            trackwin_object._playing = true;
            play_midi_file(this._song.tick2second(tick));
        }
    }
    

    tracks_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        var tick = parseInt(x / this._pixels_per_tick);
        
        if (y < this._ruler_height)
        {
            for (const bar of this._song.bars)
            {
                if ((tick >= bar.start) && (tick < bar.end))
                {
                    if (this._xgrid_highlight_element)
                    {
                        this._xgrid_highlight_element.remove();
                    }
                    
                    var xpos = parseInt(bar.start * this._pixels_per_tick);
                    var width = parseInt(bar.ticks * this._pixels_per_tick);
                    this._xgrid_highlight_element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    this._xgrid_highlight_element.id = "pw_xgrid_highlight";
                    this._xgrid_highlight_element.setAttribute("height", this._note_height * this._num_notes);
                    this._xgrid_highlight_element.setAttribute("width", width);
                    this._xgrid_highlight_element.setAttribute("x", xpos);
                    this._xgrid_highlight_element.setAttribute("y", this._track_y);
                    this._xgrid_highlight_element.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:0;fill-opacity:0.1;stroke-opacity:0.0");
                    this._tracks_canvas.appendChild(this._xgrid_highlight_element);
                }                
            }
            
            if (this._key_highlight_element)
            {
                if (this._key_highlight_type == 'white_key')
                {
                    this._key_highlight_element.style.fill = this._white_key_color;
                }
                else if (this._key_highlight_type == 'black_key')
                {
                    this._key_highlight_element.style.fill = this._black_key_color;
                }
                this._key_highlight_element = null;
            }
        }
        else if (y >= this._ruler_height)
        {
            if (this._xgrid_highlight_element)
            {
                this._xgrid_highlight_element.remove();
                this._xgrid_highlight_element = null;
            }

            var line_index = parseInt((y - this._track_y) / this._note_height);
            if (line_index < 0)
            {
                line_index = 0;
            }
            else if (line_index >= (this._num_notes))
            {
                line_index = this._num_notes - 1;
            }
            
            if (this._key_highlight_element)
            {
                if (this._key_highlight_type == 'white_key')
                {
                    this._key_highlight_element.style.fill = this._white_key_color;
                }
                else if (this._key_highlight_type == 'black_key')
                {
                    this._key_highlight_element.style.fill = this._black_key_color;
                }
            }
            
            var note = this.line2note(line_index);
            var is_white_key = this._white_notes.includes(note % 12);

            this._key_highlight_element = document.getElementById("note_info_" + this.line2note(line_index));
            if (is_white_key)
            {
                this._key_highlight_element.style.fill = this._white_key_highlight_color;
                this._key_highlight_type = 'white_key';
            }
            else
            {
                this._key_highlight_element.style.fill = this._black_key_highlight_color;
                this._key_highlight_type = 'black_key';
            }
        }
    }

    info_clickhandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        output("click: " + x + " " + y);
        
        pianowin_object.info_handle_click(x, y);
    }
    
    info_mousemovehandler(event)
    {
        let svg = event.currentTarget;
        let bound = svg.getBoundingClientRect();
        
        let x = event.clientX - bound.left - svg.clientLeft;
        let y = event.clientY - bound.top - svg.clientTop;
        
        pianowin_object.info_handle_mouse_move(x, y);
    }


    info_handle_click(x, y)
    {
        if (y < this._ruler_height)
        {
        }
    }
    

    info_handle_mouse_move(x, y)
    {
        // output("handle_mouse_over " + x + " " + y);
        var tick = parseInt(x / this._pixels_per_tick);
        
        if (y < this._ruler_height)
        {
            if (this._key_highlight_element)
            {
                if (this._key_highlight_type == 'white_key')
                {
                    this._key_highlight_element.style.fill = this._white_key_color;
                }
                else if (this._key_highlight_type == 'black_key')
                {
                    this._key_highlight_element.style.fill = this._black_key_color;
                }
                this._key_highlight_element = null;
            }
        }
        else if (y >= this._ruler_height)
        {
            if (this._xgrid_highlight_element)
            {
                this._xgrid_highlight_element.remove();
                this._xgrid_highlight_element = null;
            }

            var line_index = parseInt((y - this._track_y) / this._note_height);
            if (line_index < 0)
            {
                line_index = 0;
            }
            else if (line_index >= (this._num_notes))
            {
                line_index = this._num_notes - 1;
            }
            
            if (this._key_highlight_element)
            {
                if (this._key_highlight_type == 'white_key')
                {
                    this._key_highlight_element.style.fill = this._white_key_color;
                }
                else if (this._key_highlight_type == 'black_key')
                {
                    this._key_highlight_element.style.fill = this._black_key_color;
                }
            }
            
            var note = this.line2note(line_index);
            var is_white_key = this._white_notes.includes(note % 12);

            this._key_highlight_element = document.getElementById("note_info_" + this.line2note(line_index));
            if (is_white_key)
            {
                this._key_highlight_element.style.fill = this._white_key_highlight_color;
                this._key_highlight_type = 'white_key';
            }
            else
            {
                this._key_highlight_element.style.fill = this._black_key_highlight_color;
                this._key_highlight_type = 'black_key';
            }
        }
    }

    create_rulers()
    {
        var tick;
        var next_seconds = 0;
        
        for (tick = 0; tick < this._song.ticks; tick++)
        {
            var seconds = this._song.tick2second(tick);

            if (seconds > next_seconds)
            {
                var width = 1;
                var xpos = parseInt(tick * this._pixels_per_tick);
                var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                ruler_line.id = 'seconds_ruler_' + tick.toString();
                ruler_line.setAttribute("x1", xpos);
                ruler_line.setAttribute("x2", xpos);
                ruler_line.setAttribute("y1", 1);
                ruler_line.setAttribute("y2", (this._ruler_height / 2) - 1);
                ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
                this._tracks_canvas.appendChild(ruler_line);
                                        
                var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                ruler_text.id = 'seconds_text_' + tick.toString();
                ruler_text.setAttribute("x", xpos + 2);
                ruler_text.setAttribute("y", 12);
                ruler_text.setAttribute("style", "fill:black;font-size:12px");
                var mins = parseInt(seconds / 60);
                var secs = parseInt(seconds) % 60;
                var secs_string = secs.toString();
                if (secs < 10)
                {
                    secs_string = "0" + secs_string;
                }
                
                ruler_text.textContent = mins.toString() + ':' + secs_string;
                this._tracks_canvas.appendChild(ruler_text);

                next_seconds += 5;
            }
            
        }


        var bar_index = 0;
        for (const bar of this._song.bars)
        {
            var width = 1;
            var bar_space = parseInt(bar.ticks * this._pixels_per_tick);
            var ruler_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ruler_line.id = 'bars_ruler_' + bar_index.toString();
            ruler_line.setAttribute("x1", bar_index * bar_space);
            ruler_line.setAttribute("x2", bar_index * bar_space);
            ruler_line.setAttribute("y1", (this._ruler_height / 2) + 1);
            ruler_line.setAttribute("y2", (this._ruler_height) - 2);
            ruler_line.setAttribute("style", "stroke:black;stroke-width:1;");
            this._tracks_canvas.appendChild(ruler_line);

            var ruler_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ruler_text.id = 'bars_text' + bar_index.toString();
            ruler_text.setAttribute("x", (bar_index * bar_space) + 2);
            ruler_text.setAttribute("y", 24);
            ruler_text.setAttribute("style", "fill:black;font-size:12px");
            ruler_text.textContent = (bar_index + 1).toString();
            this._tracks_canvas.appendChild(ruler_text);

            bar_index++;
        }

        return bar_index * width;
    }
    

    create_track(track_index)
    {
        var notes_width = 0;
        var notes_width_tmp;
        var note;
        var track;
        

        track = this._song.tracks[track_index];

        for (note = 0; note < this._num_notes; note++)
        {
            notes_width_tmp = this.create_note_bars(note, this._song.bars);
            if (notes_width_tmp > notes_width)
            {
                notes_width = notes_width_tmp;
            }
        }
        
        var width_style = "width:" + (notes_width + 100).toString() + ";";
        var height_style = "height:" + ((this._note_height * this._num_notes) + this._track_y).toString() + ";";

        this._tracks_canvas.setAttribute("style", width_style + height_style);

        var wh = this._tracks_canvas.getClientRects()[0];
        this._height = wh.height;
        this._notes_width = wh.width;

        this.fill_note_events(track_index, track);

        var info_width = this._info_width;
        var info_width_tmp;
        var num_white = 0;
        var i;

        for (i = 0; i < this._num_notes; i++)
        {
            if (this._white_notes.includes(i % 12))
            {
                num_white++;
                this._white_key_num.push(i);
            }
        }

        i = num_white - 1;
        for (note = 0; note < this._num_notes; note++)
        {
            if (this._white_notes.includes(note % 12))
            {
                info_width_tmp = this.create_note_info(note, true, i, track);
                if (info_width_tmp > info_width)
                {
                    info_width = info_width_tmp;
                }
                i--;
            }
        }

        for (note = 0; note < this._num_notes; note++)
        {
            if (!this._white_notes.includes(note % 12))
            {
                info_width_tmp = this.create_note_info(note, false, 0, track);
                if (info_width_tmp > info_width)
                {
                    info_width = info_width_tmp;
                }
            }
        }

        width_style = "width:" + (info_width).toString() + ";";

        this._info_canvas.setAttribute("style", width_style);

        this.create_playhead();
    }

    fill_note_events(track_index, track)
    {
        

        for (const event of track.events)
        {
            if (event.type != 'note')
            {
                continue;
            }
            
            var note = event.note;
            var width = parseInt((event.end - event.start) * this._pixels_per_tick);
            var height = this._note_height - 4;
            var y = this._track_y + (this.note2line(note) * this._note_height) + 2;
            var x = parseInt(event.start * this._pixels_per_tick);
            var event_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            event_rect.id = 'pw_event_' + track_index.toString() + '_' + note.toString() + '_' + event.start.toString();
            event_rect.setAttribute("x", x);
            event_rect.setAttribute("y", y);
            event_rect.setAttribute("width", width);
            event_rect.setAttribute("height", height);
            event_rect.setAttribute("style", "fill:" + this._note_color + ";stroke:black;stroke-width:1;fill-opacity:0.5;stroke-opacity:1.0");
            this._tracks_canvas.appendChild(event_rect);
        }
        
    }


    note2line(note)
    {
        return this._num_notes - (note + 1);
    }
    
    line2note(line)
    {
        return this._num_notes - (line + 1);
    }
    
    
    create_note_bars(note, bars)
    {
        var bar_index = 0;
        for (const bar of bars)
        {
            var width = parseInt(bar.ticks * this._pixels_per_tick);
            var bar_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

            bar_rect.id = 'note_' + note.toString() + '_' + bar_index.toString();
            bar_rect.setAttribute("height", this._note_height);
            bar_rect.setAttribute("width", width);
            bar_rect.setAttribute("x", bar_index * width);
            bar_rect.setAttribute("y", this._track_y + (this.note2line(note) * this._note_height));
            bar_rect.setAttribute("style", "fill:" + this._bg_color + ";stroke:black;stroke-width:1;fill-opacity:0.1;stroke-opacity:1.0");
            this._tracks_canvas.appendChild(bar_rect);
            bar_index++;
        }

        return bar_index * width;
    }

    note2key_y(note)
    {
        if (note == 127)
        {
            return this._track_y;
        }
        
        if (this._white_notes.includes(note % 12))
        {
            return this._track_y + (this._white_key_num[note] * this._white_note_height) - parseInt(this._white_note_height * 1 / 3);
        }
        else
        {
            return this._track_y + (this.note2line(note) * this._note_height);
        }
    }

    create_note_info(note, is_white, white_key_num, track)
    {
        var info_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        var height;
        var width;
        var y;
        var fill_color;

        if (is_white)
        {
            width = this._info_width;
            height = this._white_note_height;
            y = this._track_y + (white_key_num * this._white_note_height) - parseInt(this._white_note_height * 1 / 3);
            fill_color = this._white_key_color;

            if (note == 127)
            {
                height = parseInt(this._white_note_height * 2 / 3);
                y = this._track_y;
            }
        }
        else
        {
            width = parseInt(this._info_width * 2 / 3);
            height = this._note_height;
            y = this._track_y + (this.note2line(note) * this._note_height);
            fill_color = this._black_key_color;
        }
        
        
        info_rect.id = 'note_info_' + note.toString();
        info_rect.setAttribute("height", height);
        info_rect.setAttribute("width", width);
        info_rect.setAttribute("x", 0);
        info_rect.setAttribute("y", y);
        info_rect.setAttribute("style", "fill:" + fill_color + ";stroke:black;stroke-width:1;fill-opacity:1.0;stroke-opacity:1.0");
        this._info_canvas.appendChild(info_rect);
        
        return width;
    }

    handle_time(time, unit)
    {
        if (unit == 'seconds')
        {
            this._playhead_ticks = this._song.second2tick(time);
            this.position_playhead();
            var xpos = this._playhead_ticks * this._pixels_per_tick;
            //output("pos: " + xpos + " scrollLeft: " + this._tracks_frame.scrollLeft);
            
            if (xpos > (this._tracks_frame.clientWidth + this._tracks_frame.scrollLeft - (this._tracks_frame.clientWidth / 10)))
            {
                this._tracks_frame.scrollLeft = xpos;
            }
            else if (xpos < this._tracks_frame.scrollLeft)
            {
                this._tracks_frame.scrollLeft = xpos - this._tracks_frame.clientWidth;
            }
        }
    }
    
    create_playhead()
    {
        var xpos = parseInt(this._playhead_ticks * this._pixels_per_tick);
        var playhead_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        playhead_line.id = 'pw_playhead';
        playhead_line.setAttribute("x1", xpos);
        playhead_line.setAttribute("x2", xpos);
        playhead_line.setAttribute("y1", this._track_y);
        playhead_line.setAttribute("y2", this._height);
        playhead_line.setAttribute("style", "stroke:black;stroke-width:2;");
        this._playhead_element = playhead_line;
        this._tracks_canvas.appendChild(playhead_line);
    }
    
    position_playhead()
    {
        var xpos = parseInt(this._playhead_ticks * this._pixels_per_tick);
        this._playhead_element.setAttribute("x1", xpos);
        this._playhead_element.setAttribute("x2", xpos);
    }
}
    
