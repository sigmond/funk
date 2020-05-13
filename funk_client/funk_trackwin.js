function trackwin_load_file(filename)
{
    var trackwin = document.getElementById("trackwin");
    if (trackwin)
    {
        trackwin.remove();
    }
    
    var trackwin_frame = document.getElementById("trackwin_frame");
    trackwin = trackwin_create(trackwin_frame);
    trackwin_show_label(trackwin, filename);
}

function trackwin_create(frame)
{
    var trackwin = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    
    trackwin.setAttribute("class", "trackwin-canvas");
    trackwin.id = 'trackwin';

    frame.appendChild(trackwin);

    return trackwin;
}

function trackwin_show_label(trackwin, filename)
{
    var label = document.createElementNS("http://www.w3.org/2000/svg", "text");

    label.setAttribute("x", "40");
    label.setAttribute("y", "40");
    label.setAttribute("style", "fill:red;");
    label.textContent = filename;

    trackwin.appendChild(label);

    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "200");
    circle.setAttribute("cy", "200");
    circle.setAttribute("r", "100");

    trackwin.appendChild(circle);

}
