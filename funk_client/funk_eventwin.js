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
        this._info_width = 100;        

        this._bg_color = "blue";
        
        this._playhead_ticks = 0;
        this._playhead_xpos = 0;
        
        this._menu_frame = menu_frame;
        this._rulers_frame = rulers_frame;
        this._tracks_frame = tracks_frame;
        this._info_frame = info_frame;
        
        this._tracks_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");        
        this._tracks_canvas.setAttribute("class", this._prefix + "-tracks-canvas");
        this._tracks_canvas.id = this.prefix + '_tracks_canvas';        
        tracks_frame.appendChild(this._tracks_canvas);
        
        this._info_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._info_canvas.setAttribute("class", this._prefix + "-info-canvas");
        this._info_canvas.id = this._prefix + '_info_canvas';
        info_frame.appendChild(this._info_canvas);
        
        this._rulers_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._rulers_canvas.id = this._prefix + '_rulers_canvas';
        rulers_frame.appendChild(this._rulers_canvas);

        this._menu_canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._menu_canvas.id = this._prefix + '_menu_canvas';
        menu_frame.appendChild(this._menu_canvas);        
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
    
    y2track(y)
    {
        return parseInt((y - this._track_y) / this._track_height);
    }
    
    y2track_zoomed(y)
    {
        return parseInt((y - this._track_y) / (this._track_height * this._tracks_zoom_y));
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
            this._rulers_frame.scrollLeft = xpos - this._tracks_frame.clientWidth;
            this._tracks_frame.scrollLeft = xpos - this._tracks_frame.clientWidth;
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
}
    


