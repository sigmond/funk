function pianowin_load_track(trackname)
{
    var pianowin = document.getElementById("pianowin");
    if (pianowin)
    {
        pianowin.remove();
    }
    
    var pianowin_frame = document.getElementById("pianowin_frame");
    pianowin = pianowin_create(pianowin_frame);
    pianowin_show_label(pianowin, trackname);
}

function pianowin_create(frame)
{
    var pianowin = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    
    pianowin.setAttribute("class", "pianowin-canvas");
    pianowin.id = 'pianowin';

    frame.appendChild(pianowin);

    return pianowin;
}

function pianowin_show_label(pianowin, filename)
{
    var label = document.createElementNS("http://www.w3.org/2000/svg", "text");

    label.setAttribute("x", "40");
    label.setAttribute("y", "40");
    label.setAttribute("style", "fill:red;");
    label.textContent = filename;

    pianowin.appendChild(label);

    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "200");
    circle.setAttribute("cy", "200");
    circle.setAttribute("r", "100");

    pianowin.appendChild(circle);

}
