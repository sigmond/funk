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

class eventwin
{
    constructor(prefix, menu_frame, rulers_frame, info_frame, tracks_frame, song)
    {
        this._prefix = prefix;
        this._song = song;
        this._ruler_height = 30;
        this._track_y = 0;
        this._tracks_zoom_x = 1.0;
        this._tracks_zoom_y = 1.0;
        this._info_width = 150;        

        this._bg_color = "blue";
        
        this._playhead_ticks = 0;
        this._playhead_xpos = 0;

        this._area_copy_buffer = null;
        this._select_element = null;
        
        this._menu_frame = menu_frame;
        this._rulers_frame = rulers_frame;
        this._tracks_frame = tracks_frame;
        this._info_frame = info_frame;
        
        this.create_tracks_canvas(); 
        this.create_info_canvas();
        this.create_rulers_canvas();
        this.create_menu_canvas();
    }

    create_tracks_canvas()
    {
        this._tracks_canvas = document.getElementById(this._prefix + '_tracks_canvas');
        if (this._tracks_canvas)
        {
            this._tracks_canvas.remove();
        }
        this._tracks_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");        
        this._tracks_canvas.setAttribute("class", this._prefix + "-tracks-canvas");
        this._tracks_canvas.id = this._prefix + '_tracks_canvas';        
        this._tracks_frame.appendChild(this._tracks_canvas);
    }

    create_info_canvas()
    {
        this._info_canvas = document.getElementById(this._prefix + '_info_canvas');
        if (this._info_canvas)
        {
            this._info_canvas.remove();
        }
        this._info_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._info_canvas.setAttribute("class", this._prefix + "-info-canvas");
        this._info_canvas.id = this._prefix + '_info_canvas';
        this._info_frame.appendChild(this._info_canvas);
    }
    
    create_rulers_canvas()
    {
        this._rulers_canvas = document.getElementById(this._prefix + '_rulers_canvas');
        if (this._rulers_canvas)
        {
            this._rulers_canvas.remove();
        }
        this._rulers_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._rulers_canvas.id = this._prefix + '_rulers_canvas';
        this._rulers_frame.appendChild(this._rulers_canvas);
    }
    
    create_menu_canvas()
    {
        this._menu_canvas = document.getElementById(this._prefix + '_menu_canvas');
        if (this._menu_canvas)
        {
            this._menu_canvas.remove();
        }
        this._menu_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._menu_canvas.id = this._prefix + '_menu_canvas';
        this._menu_frame.appendChild(this._menu_canvas);        
    }
    
    update_tracks(track_indexes)
    {
        for (const track_index of track_indexes)
        {
            this.update_track(track_index);
        }

        this.adjust_num_tracks(track_indexes.length);
    }

    adjust_num_tracks(num_tracks)
    {
    }
    
    x2tick(x)
    {
        return parseInt(x / this._pixels_per_tick);
    }
    
    x2tick_zoomed(x)
    {
        return parseInt(x / (this._pixels_per_tick * this._tracks_zoom_x));
    }
    
    tick2x(tick)
    {
        return parseInt(tick * this._pixels_per_tick);
    }
    
    tick2x_zoomed(tick)
    {
        return parseInt(tick * this._pixels_per_tick * this._tracks_zoom_x);
    }
    
    line2y(line)
    {
        return parseInt(line * this._line_height);
    }
    
    line2y_zoomed(line)
    {
        return parseInt(line * this._line_height * this._tracks_zoom_y);
    }

    y2line(y)
    {
        return parseInt((y - this._track_y) / this._line_height);
    }
    
    y2line_zoomed(y)
    {
        return parseInt((y - this._track_y) / (this._line_height * this._tracks_zoom_y));
    }


    tracks_handle_key_down(key)
    {
        output("tracks_handle_key_down: " + key);

        if (this._mouse_over_tracks)
        {
            if (key == key_p)
            {
                if (trackwin_object._playing)
                {
                    stop();
                }
                
                trackwin_object.handle_time(this._mouse_at_tick);
                pianowin_object.handle_time(this._mouse_at_tick);
                
                if (trackwin_object._playing)
                {
                    play_midi_file(this._mouse_at_tick);
                }
                
                return true;
            }

            if (global_ctrl_down)
            {
                if (key == key_x)
                {
                    this.handle_cut(this._mouse_at_tick, global_shift_down);
                }
                else if (key == key_c)
                {
                    this.handle_copy(this._mouse_at_tick);
                }
                else if (key == key_v)
                {
                    this.handle_paste_insert_merge(this._mouse_at_tick, global_shift_down, false);
                }
                else if (key == key_m)
                {
                    this.handle_paste_insert_merge(this._mouse_at_tick, false, true);
                }
                else if (key == key_z)
                {
                    this.handle_undo(this._mouse_at_tick);
                }
                else if (key == key_y)
                {
                    this.handle_redo(this._mouse_at_tick);
                }
                else if (key == key_plus)
                {
                    this.tracks_do_zoom_x(this._mouse_at_x, true);
                }
                else if (key == key_minus)
                {
                    this.tracks_do_zoom_x(this._mouse_at_x, false);
                }
                else if ((key == key_up) || (key == key_down))
                {
                    if (this._prefix == "pianowin")
                    {
                        if (key == key_up)
                        {
                            if (this._track_index > 0)
                            {
                                this._track_index--;
                            }
                        }
                        else
                        {
                            if (this._track_index < (this._song.tracks.length - 1))
                            {
                                this._track_index++;
                            }
                        }
                        this.update_track(this._track_index);
                        this.scroll_to_notes(this.tick2x_zoomed(this._mouse_at_tick), this._track_index);
                    }
                }

                return true;
            }
            else if (global_shift_down)
            {
                if (key == key_plus)
                {
                    this.tracks_do_zoom_y(this._mouse_at_y, true);
                }
                else if (key == key_minus)
                {
                    this.tracks_do_zoom_y(this._mouse_at_y, false);
                }
                else if (
                         (key == key_up) || 
                         (key == key_down) || 
                         (key == key_left) || 
                         (key == key_right) ||
                         (key == key_home) ||
                         (key == key_end)
                        )
                {
                    this.adjust_select_area(this._mouse_at_x, this._mouse_at_y, true, key);
                }

                return true;
            }
        }

        return false;
    }
    


    tracks_handle_wheel(x, y, delta_y)
    {
//         output("x: " + x);

        if (global_ctrl_down)
        {
            this.tracks_do_zoom_x(x, (delta_y < 0));
        }
        else if (global_shift_down)
        {
            this.tracks_do_zoom_y(y, (delta_y < 0));
        }
    }

    tracks_do_zoom_x(x, zoom_in)
    {
        var k = (x - this._rulers_frame.scrollLeft) / this._rulers_frame.clientWidth;
        var old_zoom = this._tracks_zoom_x;

        if (zoom_in)
        {
            this._tracks_zoom_x += 0.2;
        }
        else
        {
            if (this._tracks_zoom_x > 0.3)
            {
                this._tracks_zoom_x -= 0.2;
            }
        }

        
        var width_style = "width :" + (this._tracks_width * this._tracks_zoom_x).toString() + ";";
        var rulers_height_style = "height :" + this._ruler_height.toString() + ";";
        var tracks_height_style = "height :" + (this._height * this._tracks_zoom_y).toString() + ";";
        this._rulers_canvas.setAttribute("style", width_style + rulers_height_style);
        this._tracks_canvas.setAttribute("style", width_style + tracks_height_style);

        var new_x = x * (this._tracks_zoom_x / old_zoom);
        this._rulers_frame.scrollLeft = new_x - (k * this._rulers_frame.clientWidth);
        this._mouse_at_x = new_x;
        this._mouse_at_tick = this.x2tick(new_x);

    }
    
    tracks_do_zoom_y(y, zoom_in)
    {
        var eventwin_frame = document.getElementById(this._prefix + "_frame");
        var k = (y - eventwin_frame.scrollTop) / eventwin_frame.clientHeight;
        var old_zoom = this._tracks_zoom_y;

        if (zoom_in)
        {
            this._tracks_zoom_y += 0.2;
        }
        else
        {
            if (this._tracks_zoom_y > 0.3)
            {
                this._tracks_zoom_y -= 0.2;
            }
        }
        
        var tracks_width_style = "width :" + (this._tracks_width * this._tracks_zoom_x).toString() + ";";
        var tracks_height_style = "height :" + (this._height * this._tracks_zoom_y).toString() + ";";
        var info_width_style = "width :" + this._info_width.toString() + ";";
        var info_height_style = "height :" + (this._height * this._tracks_zoom_y).toString() + ";";
        this._tracks_canvas.setAttribute("style", tracks_width_style + tracks_height_style);
        this._info_canvas.setAttribute("style", info_width_style + info_height_style);

        var new_y = y * (this._tracks_zoom_y / old_zoom);
        eventwin_frame.scrollTop = new_y - (k * eventwin_frame.clientHeight);
        this._mouse_at_y = new_y;
        this._mouse_at_line = this.y2line(new_y);
    }

    rulers_handle_wheel(x, y, delta_y)
    {
        if (global_ctrl_down)
        {
            this.tracks_do_zoom_x(x, (delta_y < 0));
        }
    }    


    info_handle_wheel(x, y, delta_y)
    {
        if (global_shift_down)
        {
            this.tracks_do_zoom_y(y, (delta_y < 0));
        }
    }


    remove_all_children(element)
    {
        while (element.firstChild) {
            element.removeChild(element.lastChild);
        }
    }


    handle_time(tick)
    {
        this._playhead_ticks = tick;
        this.position_playhead();
        var xpos = this.tick2x_zoomed(this._playhead_ticks);
        //output("pos: " + xpos + " scrollLeft: " + this._tracks_frame.scrollLeft);
        
        if (xpos > (this._tracks_frame.clientWidth + this._tracks_frame.scrollLeft - (this._tracks_frame.clientWidth / 10)))
        {
            this._rulers_frame.scrollLeft = xpos - 100;
            this._tracks_frame.scrollLeft = xpos - 100;
        }
        else if (xpos < this._tracks_frame.scrollLeft)
        {
            this._rulers_frame.scrollLeft = xpos - this._tracks_frame.clientWidth + 100;
            this._tracks_frame.scrollLeft = xpos - this._tracks_frame.clientWidth + 100;
        }
    }


    tick_line_from_key(key, tick_max, line_max)
    {
        var tick;
        var line;
        
        if ((key == key_left) || (key == key_home))
        {
            if (key == key_home)
            {
                tick = 1;
            }
            else
            {
                if (this._select_x2 >= this._select_x1)
                {
                    tick = this._select_tick_stop - 1;
                }
                else
                {
                    tick = this._select_tick_start;
                }
            }
            
            if (this._select_y2 >= this._select_y1)
            {
                line = this._select_line_stop - 1;
            }
            else
            {
                line = this._select_line_start;
            }
        }
        else if ((key == key_right) || (key == key_end))
        {
            if (key == key_end)
            {
                tick = tick_max;
            }
            else
            {
                if (this._select_x2 >= this._select_x1)
                {
                    tick = this._select_tick_stop;
                }
                else
                {
                    tick = this._select_tick_start;
                }
            }
            
            if (this._select_y2 >= this._select_y1)
            {
                line = this._select_line_stop - 1;
            }
            else
            {
                line = this._select_line_start;
            }
        }
        else if (key == key_up)
        {
            if (this._select_x2 >= this._select_x1)
            {
                tick = this._select_tick_stop - 1;
            }
            else
            {
                tick = this._select_tick_start;
            }
            
            if (this._select_y2 >= this._select_y1)
            {
                line = this._select_line_stop - 2;
                if (line < 0)
                {
                    line = 0;
                }
            }
            else
            {
                if (this._select_line_start <= 0)
                {
                    return;
                }
                line = this._select_line_start - 1;
            }
        }
        else if (key == key_down)
        {
            if (this._select_x2 >= this._select_x1)
            {
                tick = this._select_tick_stop - 1;
            }
            else
            {
                tick = this._select_tick_start;
            }
            
            if (this._select_y2 >= this._select_y1)
            {
                if (this._select_line_stop > (line_max - 1))
                {
                    return;
                }
                line = this._select_line_stop;
            }
            else
            {
                line = this._select_line_start + 1;
            }
        }

        return { "tick" : tick, "line" : line };
    }
    
    change_select_area(xpos, ypos, pos, cell_tick_start, cell_tick_stop)
    {
        if (ypos >= this._select_y1)
        {
            this._select_y2 = this.line2y(pos.line + 1);
            this._select_height = this._select_y2 - this._select_y1;
            this._select_line_start = this.y2line(this._select_y1);
            this._select_line_stop = pos.line + 1;
            this._select_element.setAttribute("y", this._select_y1);
            this._select_element.setAttribute("height", this._select_height);
        }
        else
        {
            this._select_y2 = this.line2y(pos.line);
            this._select_height = this._select_y1 - this._select_y2;
            this._select_line_start = pos.line;
            this._select_line_stop = this.y2line(this._select_y1);
            this._select_element.setAttribute("y", this._select_y2);
            this._select_element.setAttribute("height", this._select_height);
        }
        
        if (xpos >= this._select_x1)
        {
            this._select_x2 = this.tick2x(cell_tick_stop);
            this._select_width = this._select_x2 - this._select_x1;
            this._select_tick_start = this.tick2snap(this.x2tick(this._select_x1));
            this._select_tick_stop = cell_tick_stop;
            this._select_element.setAttribute("x", this._select_x1);
            this._select_element.setAttribute("width", this._select_width); 
        }
        else
        {
            this._select_x2 = this.tick2x(cell_tick_start);
            this._select_width = this._select_x1 - this._select_x2;
            this._select_tick_start = cell_tick_start;
            this._select_tick_stop = this.tick2snap(this.x2tick(this._select_x1));
            this._select_element.setAttribute("x", this._select_x2);
            this._select_element.setAttribute("width", this._select_width); 
        }
    }
    

    get song()
    {
        return this._song;
    }
    
    get tracks_canvas()
    {
        return this._tracks_canvas;
    }

    get info_canvas()
    {
        return this._info_canvas;
    }

    get height()
    {
        return this._height;
    }

    get tracks_width()
    {
        return this._tracks_width;
    }

    get info_width()
    {
        return this._info_width;
    }

    position_playhead()
    {
        var xpos = this.tick2x(this._playhead_ticks);
        this._playhead_element.setAttribute("x1", xpos);
        this._playhead_element.setAttribute("x2", xpos);
    }

    potmeter_create(parent, x, y, r, color, id)
    {
        var pot_line = document.getElementById(id + '_line');
        if (pot_line)
        {
            pot_line.remove();
        }
        
        var pot = document.getElementById(id);
        if (pot)
        {
            pot.remove();
        }
        
        pot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        pot.id = id;
        pot.setAttributeNS(null, 'cx', x);
        pot.setAttributeNS(null, 'cy', y);
        pot.setAttributeNS(null, 'r', r);
        pot.setAttributeNS(null, 'style', 'fill: ' + color + '; stroke: black; stroke-width: 1px;');
        pot.dataset.id = id;
        parent.appendChild(pot);
        return pot;
    }

    potmeter_highlight(pot_or_line, on)
    {
        var pot_element = document.getElementById(pot_or_line.dataset.id);
        if (on)
        {
            pot_element.style.strokeWidth = 2;
        }
        else
        {
            pot_element.style.strokeWidth = 1;
        }

        if (pot_or_line.dataset.track_index == 0)
        {
            return;
        }

        var pot_text_id = pot_element.dataset.id + '_text';
        var pot_text = document.getElementById(pot_text_id);
        if (pot_text)
        {
            pot_text.remove()
        }
        
        if (!on)
        {
            return;
        }

        pot_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        pot_text.id = pot_text_id;
        pot_text.setAttribute("x", pot_element.getAttribute("cx") - 27);
        pot_text.setAttribute("y", pot_element.getAttribute("cy"));
        pot_text.setAttribute("style", "fill:black;font-size:12px;font-weight:bold;");
        pot_text.textContent = pot_element.dataset.value;
        this._info_canvas.appendChild(pot_text);
    }

    potmeter_set_value(parent, id, value)
    {
        var pot = document.getElementById(id);
        var x1 = parseInt(pot.getAttribute("cx"));
        var y1 = parseInt(pot.getAttribute("cy"));
        var r = parseInt(pot.getAttribute("r")) + 2;
        var master_track = (parseInt(pot.dataset.track_index) == 0);
        const val_pr_deg = 270/128;
        const min_deg = 225;
        const max_deg = -45;
        var deg = min_deg - (value * val_pr_deg);
        var rad = deg * (Math.PI / 180);
        var x2 = x1 + (Math.cos(rad) * r);
        var y2 = y1 - (Math.sin(rad) * r);
        
        var pot_line = document.getElementById(id + '_line');

        if (!pot_line)
        {
            if (!master_track)
            {
                pot_line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
                pot_line.id = id + '_line';
                pot_line.setAttribute("x1", x1);
                pot_line.setAttribute("x2", x2);
                pot_line.setAttribute("y1", y1);
                pot_line.setAttribute("y2", y2);
                pot_line.setAttribute("style", "stroke:black;stroke-width:2;");
                pot_line.dataset.id = id;
                parent.appendChild(pot_line);
            }
            pot.dataset.value = value;
        }
        else
        {
            if (!master_track)
            {
                pot_line.setAttribute("x2", x2);
                pot_line.setAttribute("y2", y2);
            }
            pot.dataset.value = value;
        }

        return pot_line;
    }
    
}
    


