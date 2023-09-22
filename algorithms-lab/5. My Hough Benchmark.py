import json
from datetime import datetime

import cv2
import numpy as np

from Utils import Stroke
from my_hough import hough_py, hough_np, hough_numba

CANVAS_WIDTH = 1400
CANVAS_HEIGHT = 800

with open('strokes/line_2.json', 'r') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))
    points = stroke.to_py()

canvas = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
stroke.draw_cv(canvas)

edges = cv2.bitwise_not(
    cv2.threshold(
        cv2.cvtColor(
            canvas,
            cv2.COLOR_BGR2GRAY
        ),
        10,
        255,
        type=cv2.THRESH_BINARY
    )[1]
) / 255

thetas_ = np.linspace(
    start=-np.pi / 2,
    stop=np.pi / 2,
    num=720,
    endpoint=False
)

py_start = datetime.now()
thetas, rhos, accumulator = hough_py(edges, thetas=list(thetas_))
py_end = datetime.now()

np_start = datetime.now()
thetas, rhos, accumulator = hough_np(edges, thetas=thetas_)
np_end = datetime.now()

numba_start = datetime.now()
thetas, rhos, accumulator = hough_numba(edges, thetas=thetas_)
numba_end = datetime.now()

py_duration = (py_end - py_start).total_seconds()
np_duration = (np_end - np_start).total_seconds()
numba_duration = (numba_end - numba_start).total_seconds()

print(f'Pure Python implementation took: {py_duration:.3f} s')
print(f'NumPy implementation took: {np_duration:.3f} s')
print(f'Numba implementation took: {numba_duration:.3f} s')

# General performance -
# Pure python - x s
# NumPy - 10x s
# Numba - x/10 s
