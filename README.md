# Live Whiteboard Demo
This project demonstrates the optimal way to build a  live whiteboard application, standalone or as a part of a bigger project (something like Zoom). It is made to be fast, efficient, reliable and robust on each device, either a slow one or fast one either with a slow or fast internet connection. It uses various specialized techneques for making the user experience better.

## Structure 
- Client-side code in `live-whiteboard-demo-client`
- Server-side code in `live_whiteboard_demo_server`
- Testing for new techniques and algorithms in `algorithms-lab`

## Features
- Simple shapes like lines, rectangles and ellipses.
- Hand-drawn strokes.
- Variable width and color.
- Different line types - simple, dashed and dotted.
- Automatic smoothing of hand-drawn strokes (using Chaikin Smooth Algorithm).
- Decreasing number of points in a hand-drawn stroke for effecient memory management and live communication (using RDP algorithm).
- A robust selection tool.
- Translation of elements (after selection).d
- Changing properties of elements after they have been added.

## TODOS
- The brutally, ruthlessly, harshly, oppresively, abusively hard to implement - ERASER.
- More robust server-side.
- Selection tool alternates between elements when clicked on the overlapping part of the elements.
- Complete migration of offline capabilites to live.
- Better stroke drawing using quadratic splines.
- Hosting of the site.
- Allow resizing of line, rectangles and ellipses when selection.
- Find and implement a better way of communication changes in the drawn elements.
- Implement representation of geometric information as ratios of the canvas width and height so that canvas can be resized according to the screen size.

## Maybe ...
- Text elements.
- Pressure based stroke drawing.
- More advanced elements like -
    - Various graphs.
    - Tabular data like datasheets.
    - Flow charts.
    - Notes.